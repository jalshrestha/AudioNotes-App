'use client';

import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import AudioRecorder from './AudioRecorder';

export default function NoteCreator({ onNoteCreated }: { onNoteCreated: () => void }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const audioRecorderKey = useRef(1);

  const handleTranscriptionComplete = (text: string) => {
    // Real-time updates from the AudioRecorder
    setContent(text);
  };

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const saveNote = async () => {
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('notes')
        .insert([{ content }]);

      if (error) {
        console.error('Error saving note:', error);
        throw error;
      }

      // Clear the form and notify parent component
      setContent('');
      // Force re-mounting the AudioRecorder component to clear its state
      audioRecorderKey.current += 1;
      onNoteCreated();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Request microphone permission when component mounts
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          console.log('Microphone permission granted');
        })
        .catch(err => {
          console.error('Error accessing microphone:', err);
        });
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="p-6 bg-black rounded-lg border border-gray-800">
        <h2 className="text-xl font-medium text-white mb-4">Voice Notes</h2>
        
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Your transcribed thoughts will appear here..."
          className="w-full h-32 p-3 bg-black text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
        />
        
        <div className="mt-4 flex justify-between items-center">
          <AudioRecorder 
            key={audioRecorderKey.current}
            onTranscriptionComplete={handleTranscriptionComplete} 
          />
          
          <button
            onClick={saveNote}
            disabled={!content.trim() || isSubmitting}
            className={`px-4 py-2 rounded-lg flex items-center focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
              !content.trim() || isSubmitting
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gray-800 text-white hover:bg-gray-700'
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
    </div>
  );
} 