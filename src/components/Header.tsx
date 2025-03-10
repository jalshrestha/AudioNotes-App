'use client';

import React, { useState } from 'react';
import { useAuth } from './Auth/AuthContext';
import AuthModal from './Auth/AuthModal';

interface HeaderProps {
  onThemeToggle: () => void;
  isDarkMode: boolean;
}

export default function Header({ onThemeToggle, isDarkMode }: HeaderProps) {
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <header className="px-4 py-4 flex justify-between items-center border-b" style={{ borderColor: 'var(--card-border)' }}>
        {/* Theme Toggle Button - Left side */}
        <button 
          onClick={onThemeToggle}
          className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#8b7e57' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* App Title - Center */}
        <h1 className="text-xl font-semibold">Audio Notes</h1>
        
        {/* Login/Logout Button - Right side */}
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm truncate max-w-[120px]">{user.email}</span>
            <button 
              onClick={handleLogoutClick}
              className="px-4 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        ) : (
          <button 
            id="login-button"
            onClick={handleLoginClick}
            className="px-4 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Login
          </button>
        )}
      </header>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
} 