import type { Metadata } from "next";
import { Jost, Libre_Baskerville, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '../lib/auth/AuthContext';
import { PostHogProvider } from './providers';
import Navigation from './components/ui/navigation';

// Wes Anderson-inspired typography
const jost = Jost({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ThinkHaven",
  description: "Pressure-test your strategy before the room does. AI that challenges your thinking instead of validating it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${jost.variable} ${libreBaskerville.variable} ${jetbrainsMono.variable} font-body antialiased bg-cream text-ink`}
      >
        <PostHogProvider>
          <AuthProvider>
            <Navigation />
            {children}
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}