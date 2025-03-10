import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../lib/mongodb';

// Define Note interface
interface Note {
  _id?: string | ObjectId;
  id?: string;
  content: string;
  created_at: string;
  user_id?: string; // Add user_id field for multi-user support
}

// Helper to get current user from session
async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    return session?.user;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// GET handler - fetch all notes
export async function GET(request: NextRequest) {
  try {
    // Get user from session for data isolation
    const user = await getCurrentUser();
    const userId = user?.email || 'anonymous';
    
    console.log('GET /api/notes - User:', userId);
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const { db } = await connectToDatabase();
    const collection = db.collection('notes');
    
    console.log('Fetching notes for user:', userId);
    
    // Filter notes by user_id for data isolation
    const notes = await collection
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
    
    console.log(`Found ${notes.length} notes for user ${userId}`);
    
    // Convert MongoDB ObjectId to string
    const formattedNotes = notes.map((note: any) => ({
      ...note,
      _id: note._id.toString(),
      id: note._id.toString() // Add id field for compatibility
    }));
    
    return NextResponse.json(formattedNotes);
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes', details: error.message },
      { status: 500 }
    );
  }
}

// POST handler - create a new note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content } = body;
    
    // Get user from session
    const user = await getCurrentUser();
    const userId = user?.email || 'anonymous';
    
    console.log(`POST /api/notes - User: ${userId}, Content length: ${content?.length || 0}`);
    
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }
    
    const newNote: Note = {
      content: content.trim(),
      created_at: new Date().toISOString(),
      user_id: userId // Store user_id for data isolation
    };
    
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection('notes');
      
      console.log('Saving note to MongoDB...');
      const result = await collection.insertOne(newNote);
      console.log('Note saved successfully with ID:', result.insertedId);
      
      // Add the generated _id to the note
      const savedNote: Note = {
        ...newNote,
        _id: result.insertedId.toString(),
        id: result.insertedId.toString()
      };
      
      return NextResponse.json(savedNote);
    } catch (dbError: any) {
      console.error('Database error creating note:', dbError);
      
      // Generate a local ID for the note
      const localNote: Note = {
        ...newNote,
        _id: `local-${Date.now()}`,
        id: `local-${Date.now()}`
      };
      
      // Return the note with a local ID and a warning
      return NextResponse.json({
        ...localNote,
        _warning: 'Note saved locally due to database connection issues'
      });
    }
  } catch (error: any) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

// DELETE handler - delete a note
export async function DELETE(request: NextRequest) {
  try {
    // Get user from session for data isolation
    const user = await getCurrentUser();
    const userId = user?.email || 'anonymous';
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log(`DELETE /api/notes - User: ${userId}, Note ID: ${id}`);
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    // Try to convert to ObjectId if it's a valid MongoDB ID
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      // If not a valid ObjectId, use the id as is
      objectId = id;
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection('notes');
    
    console.log(`Attempting to delete note ${id} for user ${userId}`);
    
    // Only allow users to delete their own notes
    const result = await collection.deleteOne({ 
      _id: objectId,
      user_id: userId // Ensure user can only delete their own notes
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Note not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }
    
    console.log(`Successfully deleted note ${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note', details: error.message },
      { status: 500 }
    );
  }
} 