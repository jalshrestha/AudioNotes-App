'use client';

import React, { useState, useRef } from 'react';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export default function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const transcriptRef = useRef('');
  
  // Start recording
  const startRecording = async () => {
    try {
      // Reset error state
      setError(null);
      
      // Check for browser support
      if (!('webkitSpeechRecognition' in window)) {
        setError('Your browser does not support speech recognition. Please use Chrome.');
        return;
      }
      
      // Create recognition object
      const recognition = new (window as any).webkitSpeechRecognition();
      
      // Set properties
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Clear existing text
      setTranscript('');
      transcriptRef.current = '';
      onTranscriptionComplete('');
      
      // Handle results
      recognition.onresult = (event: any) => {
        // Format the transcript with proper spaces
        let formattedTranscript = '';
        
        for (let i = 0; i < event.results.length; i++) {
          // Get the current result's transcript
          const currentTranscript = event.results[i][0].transcript.trim();
          
          // Skip empty results
          if (!currentTranscript) continue;
          
          // Add space between sentences
          if (i > 0) {
            const lastChar = formattedTranscript.charAt(formattedTranscript.length - 1);
            // If the last character isn't already a punctuation mark or space, add a space
            if (!/[.!?,;\s]/.test(lastChar)) {
              formattedTranscript += ' ';
            }
          }
          
          // Add current result to formatted transcript
          formattedTranscript += currentTranscript;
          
          // Add period at the end of sentences if missing
          if (event.results[i].isFinal) {
            const lastChar = formattedTranscript.charAt(formattedTranscript.length - 1);
            if (!/[.!?,;]/.test(lastChar)) {
              formattedTranscript += '. ';
            } else if (lastChar !== ' ') {
              formattedTranscript += ' ';
            }
          }
        }
        
        // Format the text with proper capitalization and spacing
        formattedTranscript = formattedTranscript
          // Ensure space after punctuation
          .replace(/([.!?,;])([A-Za-z])/g, '$1 $2')
          // Capitalize first letter of sentences
          .replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase())
          // Remove extra spaces
          .replace(/\s+/g, ' ')
          .trim();
        
        // Save to ref for buttons to use
        transcriptRef.current = formattedTranscript;
        setTranscript(formattedTranscript);
        
        // Update the parent component
        onTranscriptionComplete(formattedTranscript);
      };
      
      // Handle errors
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
      };
      
      // Start recording
      recognition.start();
      setIsRecording(true);
      
      // Store in window object for easier access and stopping
      (window as any).recognition = recognition;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Failed to start speech recognition');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if ((window as any).recognition) {
      (window as any).recognition.stop();
      (window as any).recognition = null;
    }
    setIsRecording(false);
  };
  
  // Clear all text
  const clearText = () => {
    transcriptRef.current = '';
    setTranscript('');
    onTranscriptionComplete('');
  };
  
  // Remove last word
  const removeLastWord = () => {
    // Get the current transcript
    const currentText = transcriptRef.current;
    
    if (currentText.length === 0) return;
    
    // Remove the last word or character
    let newText;
    const lastSpaceIndex = currentText.lastIndexOf(' ');
    
    if (lastSpaceIndex !== -1) {
      // Remove the last word if there's a space
      newText = currentText.substring(0, lastSpaceIndex);
    } else {
      // Otherwise clear everything
      newText = '';
    }
    
    // Update the transcript
    transcriptRef.current = newText;
    setTranscript(newText);
    onTranscriptionComplete(newText);
  };
  
  return (
    <div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      
      <div className="flex flex-wrap gap-2 mb-2">
        {!isRecording ? (
          <button
            id="start-recording-button"
            onClick={startRecording}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
            Stop Listening
          </button>
        )}
        
        <button
          onClick={clearText}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v1h10V3a1 1 0 112 0v1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zm1 5a1 1 0 00-1 1v8a1 1 0 001 1h10a1 1 0 001-1V8a1 1 0 00-1-1H5z" clipRule="evenodd" />
          </svg>
          Clear
        </button>
        
        <button
          onClick={removeLastWord}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6.707 4.879A3 3 0 018.828 4H15a3 3 0 013 3v6a3 3 0 01-3 3H8.828a3 3 0 01-2.12-.879l-4.415-4.414a1 1 0 010-1.414l4.414-4.414zm4 2.414a1 1 0 00-1.414 1.414L10.586 10l-1.293 1.293a1 1 0 101.414 1.414L12 11.414l1.293 1.293a1 1 0 001.414-1.414L13.414 10l1.293-1.293a1 1 0 00-1.414-1.414L12 8.586l-1.293-1.293z" clipRule="evenodd" />
          </svg>
          Backspace
        </button>
      </div>
      
      {isRecording && (
        <div className="mt-2 text-xs text-gray-500">
          Listening to your voice...
        </div>
      )}
    </div>
  );
} 