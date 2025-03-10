// API client for notes with caching and optimized error handling
export interface Note {
  _id?: string;
  id?: string;
  content: string;
  created_at: string;
  user_id?: string; // Added for multi-user support
}

// Cache for notes to minimize API calls
let notesCache: {
  data: Note[];
  timestamp: number;
  userId?: string;
} | null = null;

// Cache expiration in milliseconds (increased to 5 minutes for better offline support)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Flag to track if we're in offline mode
let isOfflineMode = false;

// Wrapper function for safer API calls with fallbacks
function safeApiCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  return new Promise<T>(async (resolve) => {
    try {
      const result = await fn();
      return resolve(result);
    } catch (error) {
      console.error('API call failed:', error);
      return resolve(fallback);
    }
  });
}

// Get all notes with caching
export async function getAllNotes(forceRefresh = false): Promise<Note[]> {
  // Skip cache if force refresh is requested
  if (notesCache && !forceRefresh && Date.now() - notesCache.timestamp < CACHE_EXPIRATION) {
    console.log('Using cached notes data');
    
    // Get current user ID
    const userId = getCurrentUserId();
    
    // Only use cache if it's for the same user
    if (userId === notesCache.userId) {
      return notesCache.data;
    }
  }
  
  try {
    console.log('Fetching notes from API...');
    
    // Get the current user ID
    const userId = getCurrentUserId();
    console.log('Getting notes for user:', userId);
    
    // Try to get notes from API
    const response = await fetch('/api/notes');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const notes: Note[] = await response.json();
    console.log(`Fetched ${notes.length} notes from API`);
    
    // Update cache
    notesCache = {
      data: notes,
      timestamp: Date.now(),
      userId
    };
    
    // Also save to local storage for offline access
    saveNotesToLocalStorage(notes);
    
    isOfflineMode = false;
    return notes;
  } catch (error) {
    console.error('Error fetching notes:', error);
    
    // Set offline mode flag
    isOfflineMode = true;
    
    // Use cache even if expired in case of error
    if (notesCache) {
      console.log('Using expired cache due to API error');
      return notesCache.data;
    }
    
    // Fall back to local storage
    console.log('Falling back to local storage');
    return getLocalNotes();
  }
}

// Save notes to local storage
function saveNotesToLocalStorage(notes: Note[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    const userId = getCurrentUserId();
    const storageKey = `audio-notes-${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving notes to local storage:', error);
  }
}

// Save a new note via the API
export async function saveNote(content: string): Promise<Note> {
  if (typeof window === 'undefined') {
    return createLocalFallbackNote(content);
  }

  try {
    console.log('Attempting to save note to server...');
    const userId = getCurrentUserId();
    
    // First check connectivity before trying to save
    let isOnline = true;
    try {
      const pingResponse = await fetch('/api/ping', {
        method: 'HEAD',
        signal: AbortSignal.timeout(2000)
      });
      isOnline = pingResponse.ok;
    } catch (e) {
      console.warn('Network check failed, assuming offline mode:', e);
      isOnline = false;
    }
    
    if (!isOnline) {
      console.log('Device appears to be offline, saving note locally');
      const localNote = createLocalFallbackNote(content);
      saveLocalNote(localNote);
      return localNote;
    }
    
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      throw new Error(`Error saving note: ${response.status} ${response.statusText}`);
    }
    
    const newNote = await response.json();
    console.log('Note saved successfully with ID:', newNote.id || newNote._id);
    
    // Invalidate cache after adding new note
    notesCache = null;
    
    return newNote;
  } catch (error) {
    console.error('Error saving note:', error);
    
    // Create a local fallback note
    const fallbackNote = createLocalFallbackNote(content);
    console.log('Created local fallback note with ID:', fallbackNote.id);
    
    // Save to local storage
    saveLocalNote(fallbackNote);
    
    // Show error toast to user
    if (typeof document !== 'undefined') {
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed bottom-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded shadow-lg z-50';
      errorToast.textContent = 'Note saved locally. Will sync when connection is restored.';
      document.body.appendChild(errorToast);
      setTimeout(() => errorToast.remove(), 5000);
    }
    
    return fallbackNote;
  }
}

// Create a fallback note for local storage
function createLocalFallbackNote(content: string): Note {
  return {
    id: `local-${Date.now()}`,
    _id: `local-${Date.now()}`,
    content: content.trim(),
    created_at: new Date().toISOString(),
    user_id: getCurrentUserId()
  };
}

// Delete a note via the API
export async function deleteNote(id: string): Promise<boolean> {
  try {
    console.log(`Deleting note with ID: ${id}`);
    
    // Don't even try to delete from API if ID starts with "local-"
    if (id.startsWith('local-')) {
      console.log('Deleting local note from storage only');
      deleteLocalNote(id);
      // Invalidate cache
      notesCache = null;
      return true;
    }
    
    const response = await fetch(`/api/notes?id=${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Error deleting note: ${response.status}`);
    }
    
    // Also invalidate cache
    notesCache = null;
    
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    
    // Delete from local storage as fallback
    deleteLocalNote(id);
    return true;
  }
}

// Get the current user ID for data isolation
function getCurrentUserId(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  try {
    // Try to get from session storage
    const session = sessionStorage.getItem('auth-session');
    if (session) {
      const parsedSession = JSON.parse(session);
      if (parsedSession.user?.email) {
        return parsedSession.user.email;
      }
    }
    
    // Fallback to a default or anonymous ID
    return 'anonymous-user';
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return 'anonymous-user';
  }
}

// Local storage fallback functions
function getLocalNotes(): Note[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const userId = getCurrentUserId();
    const storageKey = `audio-notes-${userId}`;
    const notesJson = localStorage.getItem(storageKey);
    if (!notesJson) return [];
    
    const notes = JSON.parse(notesJson);
    return Array.isArray(notes) ? notes : [];
  } catch (error) {
    console.error('Error getting notes from local storage:', error);
    return [];
  }
}

// Save a note to local storage
function saveLocalNote(note: Note): void {
  if (typeof window === 'undefined') return;
  
  try {
    const notes = getLocalNotes();
    notes.unshift(note);
    
    const userId = getCurrentUserId();
    const storageKey = `audio-notes-${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving note to local storage:', error);
  }
}

// Delete a note from local storage
function deleteLocalNote(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const notes = getLocalNotes();
    const filteredNotes = notes.filter(note => note.id !== id && note._id !== id);
    
    const userId = getCurrentUserId();
    const storageKey = `audio-notes-${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(filteredNotes));
  } catch (error) {
    console.error('Error deleting note from local storage:', error);
  }
}

// Sync local notes with server (could be used for offline support)
export async function syncLocalNotes(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    console.log('Starting sync of local notes to server...');
    
    // First check if we have internet connection
    try {
      const networkCheck = await fetch('/api/ping', { 
        method: 'HEAD',
        // Short timeout to quickly determine if we're online
        signal: AbortSignal.timeout(2000)
      });
      
      if (!networkCheck.ok) {
        console.log('Network seems to be down, skipping sync attempt');
        return;
      }
    } catch (networkError) {
      console.log('Network check failed, skipping sync attempt:', networkError);
      return;
    }
    
    const localNotes = getLocalNotes().filter(note => note.id?.startsWith('local-'));
    
    if (localNotes.length === 0) {
      console.log('No local notes to sync');
      return;
    }
    
    console.log(`Syncing ${localNotes.length} local notes to server`);
    
    // Show sync status to user
    const syncNotification = document.createElement('div');
    syncNotification.className = 'fixed top-4 left-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50 flex justify-between items-center';
    syncNotification.innerHTML = `
      <div>
        <span>Syncing ${localNotes.length} note${localNotes.length > 1 ? 's' : ''}...</span>
      </div>
      <div class="text-sm text-blue-200">Please wait...</div>
    `;
    document.body.appendChild(syncNotification);
    
    let successCount = 0;
    
    for (const note of localNotes) {
      try {
        // Save to server
        const savedNote = await saveNote(note.content);
        
        // If successful, remove from local storage
        if (savedNote && savedNote._id) {
          deleteLocalNote(note.id as string);
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to sync local note ${note.id}:`, error);
        // Keep in local storage for later sync attempt
      }
    }
    
    // Update notification with results
    syncNotification.className = 'fixed top-4 left-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 flex justify-between items-center';
    syncNotification.innerHTML = `
      <div>
        <span>Successfully synced ${successCount} of ${localNotes.length} note${localNotes.length > 1 ? 's' : ''}</span>
      </div>
      <button class="text-sm bg-green-600 px-2 py-1 rounded hover:bg-green-700">Dismiss</button>
    `;
    
    // Add click handler to dismiss button
    const dismissButton = syncNotification.querySelector('button');
    if (dismissButton) {
      dismissButton.addEventListener('click', () => {
        syncNotification.remove();
      });
    }
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      if (syncNotification.parentElement) {
        syncNotification.remove();
      }
    }, 5000);
    
  } catch (error) {
    console.error('Error syncing local notes:', error);
  }
} 