'use client';

import React, { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

// Add SpeechRecognitionErrorEvent interface
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export default function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<{[key: number]: boolean}>({});

  // Initialize speech recognition once on component mount
  useEffect(() => {
    try {
      const win = window as unknown as Window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };
      
      const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;
      
      if (!SpeechRecognitionAPI) {
        setError('Speech recognition not supported in this browser');
        setRecognitionSupported(false);
        return;
      }
      
      // Only create a new recognition instance if we don't already have one
      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognitionAPI();
        
        if (recognitionRef.current) {
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US'; // Set language explicitly
          
          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            // Get the final result from the last element
            const lastResultIndex = event.results.length - 1;
            const lastResult = event.results[lastResultIndex];
            
            // Check if this is a final result
            if (lastResult.isFinal) {
              // Only process results we haven't processed before
              if (!resultsRef.current[lastResultIndex]) {
                const transcript = lastResult[0].transcript;
                
                // Update state with the new transcript
                setTranscript(transcript);
                
                // Pass to parent
                onTranscriptionComplete(transcript);
                
                // Mark this result as processed
                resultsRef.current[lastResultIndex] = true;
              }
            } else {
              // For interim results, just get the latest transcript
              const currentTranscript = lastResult[0].transcript;
              
              // Update state with the interim transcript
              setTranscript(currentTranscript);
              
              // Pass to parent
              onTranscriptionComplete(currentTranscript);
            }
          };
          
          recognitionRef.current.onerror = (event: Event) => {
            // Use type assertion to access the error property
            const errorEvent = event as SpeechRecognitionErrorEvent;
            console.error('Speech recognition error:', errorEvent);
            setError(`Speech recognition error: ${errorEvent.error || 'Unknown error'}`);
          };
          
          recognitionRef.current.onend = () => {
            if (isRecording) {
              // If we're still supposed to be recording, try to restart
              try {
                recognitionRef.current?.start();
              } catch (error) {
                console.error('Error restarting speech recognition:', error);
                setError('Error restarting speech recognition');
              }
            }
          };
        }
      }
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setRecognitionSupported(false);
      setError('Error initializing speech recognition');
    }
    
    return () => {
      // Don't stop recognition here, just handle cleanup in stopRecording
    };
  }, [isRecording, onTranscriptionComplete]);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      resultsRef.current = {}; // Reset processed results
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();
      
      // Start speech recognition if supported
      if (recognitionRef.current && recognitionSupported) {
        try {
          recognitionRef.current.abort(); // Cancel any ongoing recognition
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          setError('Error starting speech recognition. Try refreshing the page.');
          return;
        }
      }
      
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    
    setIsRecording(false);
    
    // Stop media recorder
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Error stopping media recorder:', error);
      }
    }
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  };

  if (!recognitionSupported) {
    return (
      <div className="text-red-500">
        Speech recognition is not supported in your browser. Try using Chrome or Edge.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-red-500">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div>
      {!isRecording ? (
        <button
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
    </div>
  );
} 