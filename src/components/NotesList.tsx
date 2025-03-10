'use client';

import React, { useState, useEffect } from 'react';
import { getAllNotes, deleteNote, Note, syncLocalNotes } from '../utils/api';
import { useSession } from 'next-auth/react';

export default function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { data: session } = useSession();
  const [loadingStage, setLoadingStage] = useState<'idle' | 'loading' | 'syncing' | 'complete'>('idle');

  // Add a refresh counter to force re-fetching
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Effect to fetch notes on mount and refreshCounter change
  useEffect(() => {
    fetchNotes();
    
    // Try to sync any local notes with the server
    if (session?.user) {
      syncLocalNotesWithServer();
    }
  }, [refreshCounter, session]);

  // Add a refresh function that can be called by a button
  const refreshNotes = () => {
    setRefreshCounter(prev => prev + 1);
  };

  // Add a function to manually fetch notes that can be exposed to parent components
  const manualFetchNotes = () => {
    fetchNotes(true); // Force refresh from API
  };
  
  // Add a function to add a new note directly to the UI for immediate feedback
  const addNewNoteToList = (note: Note) => {
    console.log('Adding new note to list:', note);
    setNotes(prevNotes => [note, ...prevNotes]);
  };

  // Make the component expose functions to window
  useEffect(() => {
    // Attach the functions to the window object for external access
    (window as any).refreshNotesList = manualFetchNotes;
    (window as any).addNewNoteToList = addNewNoteToList;
    
    return () => {
      // Clean up
      delete (window as any).refreshNotesList;
      delete (window as any).addNewNoteToList;
    };
  }, []);

  // Sync local notes with the server
  async function syncLocalNotesWithServer() {
    try {
      setLoadingStage('syncing');
      await syncLocalNotes();
      // After syncing, fetch fresh notes
      await fetchNotes(true);
    } catch (err) {
      console.error('Error syncing notes:', err);
    } finally {
      setLoadingStage('complete');
    }
  }

  // Fetch notes from API
  async function fetchNotes(forceRefresh = false) {
    try {
      setLoadingStage('loading');
      setError(null);
      
      console.log('Fetching notes from API...');
      
      // Wrap in try-catch to handle any unexpected errors
      try {
        const notesData = await getAllNotes(forceRefresh);
        
        // Check if we got notes back
        if (Array.isArray(notesData)) {
          console.log('Fetched notes:', notesData.length);
          setNotes(notesData);
          setLoadingStage('complete');
        } else {
          // If not an array, handle gracefully
          console.error('Unexpected notes data format:', notesData);
          setError('Received invalid data format from server');
          // Try to get notes from local storage as fallback
          const localNotes = localStorage.getItem('audio-notes-app-notes');
          if (localNotes) {
            try {
              const parsedNotes = JSON.parse(localNotes);
              if (Array.isArray(parsedNotes) && parsedNotes.length > 0) {
                setNotes(parsedNotes);
                setError('Using locally stored notes. Some features may be limited.');
              }
            } catch (parseError) {
              console.error('Error parsing local notes:', parseError);
            }
          }
        }
      } catch (apiError) {
        console.error('API call error:', apiError);
        setError('Failed to fetch notes. Using local data if available.');
        
        // Try to get notes from local storage as fallback
        const localNotes = localStorage.getItem('audio-notes-app-notes');
        if (localNotes) {
          try {
            const parsedNotes = JSON.parse(localNotes);
            if (Array.isArray(parsedNotes) && parsedNotes.length > 0) {
              setNotes(parsedNotes);
              setError('Using locally stored notes. Some features may be limited.');
            }
          } catch (parseError) {
            console.error('Error parsing local notes:', parseError);
          }
        }
      }
    } catch (err) {
      // This is the outer catch for any unexpected UI rendering errors
      console.error('Error in fetchNotes UI handler:', err);
      setError('Something went wrong. Please try again later.');
      setLoadingStage('complete');
    } finally {
      setLoading(false);
    }
  }

  // Delete a note
  async function handleDeleteNote(id: string) {
    try {
      setDeleting(id);
      console.log('Deleting note with ID:', id);
      
      // Optimistic UI update - remove from UI immediately
      setNotes(notes.filter(note => {
        const noteId = String(note.id || note._id);
        return noteId !== id;
      }));
      
      // Then delete from API
      const success = await deleteNote(id);
      
      if (!success) {
        console.error('Note not deleted:', id);
        setError('Note could not be deleted. Please try again.');
        
        // Fetch notes again to restore the deleted note
        fetchNotes(true);
      }
    } catch (err: any) {
      console.error('Error deleting note:', err);
      setError(err.message || 'Error deleting note. Please try again later.');
      
      // Fetch notes again to restore the deleted note
      fetchNotes(true);
    } finally {
      setDeleting(null);
    }
  }

  // Loading state UI
  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-24 w-full max-w-md bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-24 w-full max-w-md bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 mb-2 p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
          {error}
        </div>
        <button 
          onClick={() => fetchNotes(true)} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          Your Notes
          {loadingStage !== 'idle' && loadingStage !== 'complete' && (
            <span className="ml-2 text-sm text-gray-500 animate-pulse">
              {loadingStage === 'loading' ? 'Loading...' : 'Syncing...'}
            </span>
          )}
        </h2>
        <div className="flex space-x-2">
          {session ? (
            <span className="text-sm text-gray-500 mr-2 self-center">
              Logged in as {session.user?.email}
            </span>
          ) : null}
          <button 
            onClick={refreshNotes}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            disabled={loadingStage === 'loading' || loadingStage === 'syncing'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
      
      {notes.length === 0 ? (
        <div className="p-8 text-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg">No notes yet. Start recording your thoughts!</p>
          <button
            onClick={() => document.getElementById('start-recording-button')?.click()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start Recording
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map((note) => {
            // Use either id or _id, convert to string to ensure it's a valid React key
            const noteId = String(note.id || note._id);
            const isDeleting = deleting === noteId;
            
            return (
              <div 
                key={noteId} 
                className={`p-4 rounded-lg border card transition-all hover:shadow-md ${isDeleting ? 'opacity-50' : ''}`}
                style={{ borderColor: 'var(--card-border)' }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap text-lg">{note.content}</p>
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-sm opacity-70">
                        {new Date(note.created_at).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            // Copy to clipboard
                            navigator.clipboard.writeText(note.content);
                            
                            // Show toast
                            const toast = document.createElement('div');
                            toast.className = 'fixed bottom-4 left-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                            toast.textContent = 'Copied to clipboard!';
                            document.body.appendChild(toast);
                            setTimeout(() => toast.remove(), 2000);
                          }}
                          className="p-1 text-blue-500 hover:text-blue-700"
                          aria-label="Copy note"
                          disabled={isDeleting}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteNote(noteId)}
                          className="p-1 text-red-500 hover:text-red-700"
                          aria-label="Delete note"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 