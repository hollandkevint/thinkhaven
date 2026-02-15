/**
 * Global setup for Playwright E2E tests
 * Validates environment configuration before tests run
 */

import { chromium, FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

async function globalSetup(config: FullConfig) {
  console.log('\n🔧 Running global test setup...\n')

  // Load env file if it exists (.env.local takes precedence over .env.test)
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const envFiles = ['.env.test', '.env.local']
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, '../../', envFile)
    if (fs.existsSync(envPath)) {
      console.log(`📄 Loading ${envFile} file...`)
      const envContent = fs.readFileSync(envPath, 'utf-8')
      envContent.split('\n').forEach(line => {
        // Skip comments and empty lines
        if (line.trim() && !line.trim().startsWith('#')) {
          const [key, ...valueParts] = line.split('=')
          const value = valueParts.join('=')
          if (key && value) {
            process.env[key.trim()] = value.trim()
          }
        }
      })
      console.log(`✅ ${envFile} loaded\n`)
    }
  }

  // 1. Validate required environment variables
  console.log('📋 Validating environment variables...')
  const errors: string[] = []

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('❌ NEXT_PUBLIC_SUPABASE_URL is required')
    errors.push('   Add it to apps/web/.env.local or .env.test')
  } else {
    console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
    errors.push('   Add it to apps/web/.env.local or .env.test')
  } else {
    console.log(`✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`)
  }

  if (errors.length > 0) {
    console.error('\n❌ Test environment validation failed:\n')
    errors.forEach(err => console.error(`  ${err}`))
    console.error('\nPlease configure apps/web/.env.local with your Supabase credentials.\n')
    process.exit(1)
  }

  // 2. Verify base URL configuration
  const baseURL = config.use?.baseURL || 'http://localhost:3000'
  console.log(`\n✅ Base URL configured: ${baseURL}`)

  // 3. Wait for dev server to be ready
  console.log('\n⏳ Waiting for dev server to be ready...')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  let retries = 0
  const maxRetries = 30 // 30 seconds max wait

  while (retries < maxRetries) {
    try {
      await page.goto(`${baseURL}/login`, {
        timeout: 2000,
        waitUntil: 'domcontentloaded'
      })
      console.log('✅ Dev server is ready and responding\n')
      break
    } catch (error) {
      retries++
      if (retries === maxRetries) {
        console.error(`\n❌ Dev server not responding after ${maxRetries} seconds`)
        console.error(`   Make sure to run "npm run dev" in apps/web/\n`)
        await browser.close()
        process.exit(1)
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  await browser.close()

  console.log('✅ Global setup complete - ready to run tests!\n')
  console.log('=' .repeat(60) + '\n')
}

export default globalSetup
