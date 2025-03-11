'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthError() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    // After 3 seconds, redirect to home page
    const timer = setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        
        <p className="mb-4">
          {error === 'CredentialsSignin' 
            ? 'Invalid email or password. Please try again.' 
            : error === 'undefined'
              ? 'Your session has expired or is invalid. Please log in again.'
              : `An error occurred during authentication: ${error || 'Unknown error'}`}
        </p>
        
        <p className="text-sm text-gray-500">
          You will be redirected to the home page in a few seconds...
        </p>
        
        <button 
          onClick={() => router.push('/')}
          className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
} 