'use client';

import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import { saveNote } from '../utils/api';
import AudioRecorder from './AudioRecorder';
import { useAuth } from './Auth/AuthContext';
import ErrorBoundary from './ErrorBoundary';

export default function NoteCreator({ onNoteCreated }: { onNoteCreated: () => void }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const audioRecorderKey = useRef(1);
  const { user } = useAuth();
  const accumulatedTextRef = useRef('');

  useEffect(() => {
    // Check if dark mode is enabled
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // This handler is safe because it uses a ref for accumulation
  const handleTranscriptionComplete = (text: string) => {
    // Store the new text in the ref without triggering a render
    accumulatedTextRef.current = text;
    
    // Now update the state safely
    setContent(text);
  };

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Also update the ref
    accumulatedTextRef.current = e.target.value;
  };

  const handleSaveNote = async () => {
    if (!content.trim()) {
      setError('Please add some content before saving');
      return;
    }
    
    setError(null);
    try {
      setIsSubmitting(true);

      console.log('Saving note with content:', content.trim());
      
      // Save note via API with additional error handling
      try {
        const newNote = await saveNote(content.trim());
        console.log('Note saved successfully:', newNote);
        
        // Check if it's a local note (has an ID starting with "local-")
        const isLocalNote = newNote.id?.toString().startsWith('local-');
        
        // Clear the form
        setContent('');
        accumulatedTextRef.current = '';
        audioRecorderKey.current += 1;
        
        // Trigger a refresh of the notes list
        if (typeof window !== 'undefined' && (window as any).refreshNotesList) {
          (window as any).refreshNotesList();
        }
        
        // Also call the onNoteCreated callback
        onNoteCreated();

        // Show appropriate success message
        const successMessage = document.createElement('div');
        successMessage.className = `fixed bottom-4 left-4 ${isLocalNote ? 'bg-yellow-500' : 'bg-green-500'} text-white px-4 py-2 rounded shadow-lg z-50`;
        successMessage.textContent = isLocalNote 
          ? 'Note saved locally. Will sync when connection is restored.' 
          : 'Note saved successfully!';
        document.body.appendChild(successMessage);
        setTimeout(() => successMessage.remove(), 3000);
      } catch (saveError) {
        console.error('Error during save operation:', saveError);
        setError('Failed to save note properly. A local copy has been saved.');
        
        // Even with an error, try to add the note to the UI
        if (content.trim() && typeof window !== 'undefined' && (window as any).addNewNoteToList) {
          try {
            const localNote = {
              id: `local-${Date.now()}`,
              content: content.trim(),
              created_at: new Date().toISOString()
            };
            
            (window as any).addNewNoteToList(localNote);
            
            // Clear the form
            setContent('');
            accumulatedTextRef.current = '';
            audioRecorderKey.current += 1;
          } catch (e) {
            console.error('Error handling saveError fallback:', e);
          }
        }
      }
    } catch (error: any) {
      // This is the outer catch for any unexpected errors in the UI
      console.error('Unexpected error in handleSaveNote:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request microphone permission once at the beginning
  useEffect(() => {
    const requestMicrophoneAccess = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('Microphone permission granted');
        }
      } catch (err) {
        console.error('Error accessing microphone:', err);
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      }
    };
    
    requestMicrophoneAccess();
  }, []);

  // If no user is logged in, show a message
  if (!user) {
    return (
      <div className="p-6 rounded-lg border card" style={{ borderColor: 'var(--card-border)' }}>
        <h2 className="text-xl font-bold mb-4">Voice Notes</h2>
        <p className="mb-4">Please log in to create notes</p>
        <button
          onClick={() => document.getElementById('login-button')?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none"
        >
          Log In to Start
        </button>
      </div>
    );
  }

  // Wrap the form in an error boundary
  return (
    <div className="space-y-4">
      <ErrorBoundary fallback={<div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        Something went wrong with the note creator. Please refresh the page.
      </div>}>
        <div className="p-6 rounded-lg border card" style={{ borderColor: 'var(--card-border)' }}>
          <h2 className="text-xl font-bold mb-4">Voice Notes</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-md text-red-500">
              {error}
              <button 
                onClick={() => setError(null)} 
                className="ml-2 text-sm underline"
              >
                Dismiss
              </button>
            </div>
          )}
          
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Your transcribed thoughts will appear here..."
            className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            style={{ 
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--input-border)'
            }}
          />
          
          <div className="mt-4 flex justify-between items-center">
            <AudioRecorder 
              key={audioRecorderKey.current}
              onTranscriptionComplete={handleTranscriptionComplete} 
            />
            
            <button
              onClick={handleSaveNote}
              disabled={!content.trim() || isSubmitting}
              className={`px-4 py-2 rounded-lg flex items-center focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white
                ${!content.trim() || isSubmitting
                  ? 'opacity-50 cursor-not-allowed bg-gray-500'
                  : 'hover:opacity-90 dark:bg-[#4a69bd] bg-black'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586l-1.293-1.293z" />
                <path d="M3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
              {isSubmitting ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
} 