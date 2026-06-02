'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../../../lib/auth/AuthContext'
import { Button } from '../../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import Link from 'next/link'
import { Menu, User, LogOut, LogIn, ChevronDown } from 'lucide-react'
import { CreditGuard } from '../monetization/CreditGuard'

const BetaBadge = (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-forest/10 text-forest text-[10px] font-display font-medium tracking-wider uppercase">Beta</span>
)

interface NavigationProps {
  className?: string
}

export default function Navigation({ className = '' }: NavigationProps) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Hide global nav on routes that have their own navigation/header
  const hiddenRoutes = ['/app', '/login', '/signup', '/try']
  if (hiddenRoutes.some(route => pathname?.startsWith(route))) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleLogin = () => {
    router.push('/login')
  }

  const handleSignup = () => {
    router.push('/signup')
  }

  if (loading) {
    return (
      <nav className={`flex items-center justify-between p-4 bg-cream border-b border-parchment ${className}`}>
        <div className="font-bold text-xl text-ink font-display flex items-center gap-2">
          ThinkHaven
          {BetaBadge}
        </div>
        <div className="w-8 h-8 bg-parchment rounded-full animate-pulse"></div>
      </nav>
    )
  }

  return (
    <nav className={`flex items-center justify-between p-4 bg-cream border-b border-parchment ${className}`}>
      {/* Logo/Brand */}
      <Link
        href="/"
        className="font-bold text-xl text-ink font-display hover:text-terracotta transition-colors flex items-center gap-2"
      >
        ThinkHaven
        {BetaBadge}
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-4">
        {/* Credit Balance - only show for logged-in users */}
        {user && <CreditGuard userId={user.id} />}

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <User className="w-4 h-4" />
                {user.email?.split('@')[0] || 'User'}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push('/app')}>
                <User className="w-4 h-4 mr-2" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="text-sm font-medium text-slate-blue transition-colors hover:text-ink"
            >
              Pricing
            </Link>
            <Link
              href="/assessment"
              className="text-sm font-medium text-slate-blue transition-colors hover:text-ink"
            >
              Assessment
            </Link>
            <Link
              href="/waitlist"
              className="text-sm font-medium text-slate-blue transition-colors hover:text-ink"
            >
              Beta access
            </Link>
            <Button
              variant="ghost"
              onClick={handleLogin}
              className="text-ink-light hover:text-ink"
            >
              Login
            </Button>
            <Button
              asChild
              className="bg-terracotta hover:bg-terracotta-hover text-cream font-medium"
            >
              <Link href="/try">Try a Free Session</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Open menu">
              <Menu className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {user ? (
              <>
                <DropdownMenuItem onClick={() => router.push('/app')}>
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => router.push('/try')}>
                  Try a Free Session
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/pricing')}>
                  Pricing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/assessment')}>
                  Assessment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/waitlist')}>
                  Beta access
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogin}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignup}>
                  Sign Up
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
