'use client';

import React, { useState, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { AuthProvider } from "../components/Auth/AuthContext";
import { SessionProvider } from "next-auth/react";
import ErrorBoundary from "../components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Mount effect - run only once on client-side
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Load theme from localStorage on mount
  useEffect(() => {
    if (mounted) {
      try {
        const savedTheme = localStorage.getItem('audio-notes-theme');
        if (savedTheme === 'light') {
          setIsDarkMode(false);
        } else if (savedTheme === 'dark') {
          setIsDarkMode(true);
        } else {
          // If no saved preference, check system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setIsDarkMode(prefersDark);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // Default to dark mode if there's an error
        setIsDarkMode(true);
      }
    }
  }, [mounted]);
  
  // Toggle theme function
  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    // Save theme preference to localStorage
    if (mounted) {
      try {
        localStorage.setItem('audio-notes-theme', newTheme ? 'dark' : 'light');
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${
          isDarkMode ? "dark-mode" : "light-mode"
        } min-h-screen flex flex-col`}
      >
        <ErrorBoundary>
          <SessionProvider>
            <ErrorBoundary>
              <AuthProvider>
                <Header onThemeToggle={handleThemeToggle} isDarkMode={isDarkMode} />
                <div className="flex-grow">
                  <ErrorBoundary>
                    {children}
                  </ErrorBoundary>
                </div>
                <Footer />
              </AuthProvider>
            </ErrorBoundary>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
