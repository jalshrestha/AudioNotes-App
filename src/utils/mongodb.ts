// Re-export MongoDB utility from lib/mongodb.ts for backward compatibility
import { connectToDatabase } from '../lib/mongodb';
import { ObjectId } from 'mongodb';

// Re-export the connectToDatabase function
export { connectToDatabase };

// Basic Note interface for compatibility
export interface Note {
  _id?: string | ObjectId;
  id?: string;
  content: string;
  created_at: string;
  user_id?: string; // Added for multi-user support
}

// Warning - migrate to lib version
if (typeof process !== 'undefined') {
  console.warn('Warning: Using deprecated utils/mongodb.ts. Please update imports to use lib/mongodb.ts instead.');
} 