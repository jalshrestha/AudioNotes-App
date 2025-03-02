'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

interface Note {
  id: string;
  content: string;
  created_at: string;
}

export default function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        setError(`Error fetching notes: ${error.message}`);
        return;
      }
      
      if (data) {
        setNotes(data);
      } else {
        setNotes([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching notes:', err);
      setError(`Error fetching notes: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  async function deleteNote(id: string) {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Delete error:', error);
        return;
      }
      
      // Remove the deleted note from the state
      setNotes(notes.filter(note => note.id !== id));
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  }

  if (loading) {
    return <div className="p-4 text-center text-gray-300">Loading notes...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-400">Error: {error}</div>;
  }

  if (notes.length === 0) {
    return <div className="p-4 text-center text-gray-400">No notes yet. Start recording your thoughts!</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Your Notes</h2>
      {notes.map((note) => (
        <div key={note.id} className="p-4 bg-gray-900 rounded-lg border border-gray-800">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="whitespace-pre-wrap text-gray-200">{note.content}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => deleteNote(note.id)}
              className="ml-2 p-1 text-red-500 hover:text-red-400"
              aria-label="Delete note"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 