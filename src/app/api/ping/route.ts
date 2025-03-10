import { NextResponse } from 'next/server';

// Simple endpoint to check if the API is available
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    time: new Date().toISOString()
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store'
    }
  });
} 