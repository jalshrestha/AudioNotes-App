'use client';

import React, { useState, useEffect } from 'react';
import NoteCreator from '../components/NoteCreator';
import NotesList from '../components/NotesList';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    // Initial detection
    if (typeof window !== 'undefined') {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const htmlHasDarkClass = document.documentElement.classList.contains('dark');
      setIsDarkMode(darkModeMediaQuery.matches || htmlHasDarkClass);
      
      // Listen for changes
      const handleChange = () => {
        const htmlHasDarkClass = document.documentElement.classList.contains('dark');
        setIsDarkMode(darkModeMediaQuery.matches || htmlHasDarkClass);
      };
      
      darkModeMediaQuery.addEventListener('change', handleChange);
      
      // Also observe the HTML element for class changes
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.attributeName === 'class') {
            const htmlHasDarkClass = document.documentElement.classList.contains('dark');
            setIsDarkMode(darkModeMediaQuery.matches || htmlHasDarkClass);
          }
        });
      });
      
      observer.observe(document.documentElement, { attributes: true });
      
      return () => {
        darkModeMediaQuery.removeEventListener('change', handleChange);
        observer.disconnect();
      };
    }
  }, []);

  const handleNoteCreated = () => {
    // Increment the refresh trigger to cause NotesList to refetch
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <main className="min-h-full">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold mb-4 text-center text-black">
          <span className="dark:hidden">Audio Notes App</span>
          <span className="hidden dark:inline" style={{ color: 'rgb(245,201,15)' }}>Audio Notes App</span>
        </h1>
        <p className="text-center mb-8">Speak your thoughts, save your ideas</p>
        
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <NoteCreator onNoteCreated={handleNoteCreated} />
          </div>
          
          <div key={refreshTrigger} className="mb-8">
            <NotesList />
          </div>
        </div>
      </div>
    </main>
  );
}
