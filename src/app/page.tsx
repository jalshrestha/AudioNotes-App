'use client';

import React, { useState } from 'react';
import NoteCreator from '../components/NoteCreator';
import NotesList from '../components/NotesList';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNoteCreated = () => {
    // Increment the refresh trigger to cause NotesList to refetch
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <main className="min-h-full">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold mb-4 text-center text-yellow-400">Audio Notes App</h1>
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
