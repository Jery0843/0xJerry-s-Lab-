import { NextResponse, NextRequest } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userSession = request.cookies.get('user_session')?.value;
    
    if (!userSession) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const db = getDatabase();
    if (!db) {
      return NextResponse.json({ authenticated: false }, { status: 503 });
    }

    // Decode session token (email:timestamp)
    const decoded = Buffer.from(userSession, 'base64').toString();
    const [email, timestamp] = decoded.split(':');
    
    // Check if session is expired (24 hours)
    const sessionTime = parseInt(timestamp);
    const now = Date.now();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    
    if (now - sessionTime > sessionDuration) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Get member details
    const memberStmt = await db.prepare('SELECT * FROM members WHERE email = ?');
    const member = await memberStmt.bind(email).first();

    if (!member) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: member.email,
        name: member.name,
        memberSince: member.created_at
      }
    });

  } catch (error) {
    console.error('Error checking user session:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}