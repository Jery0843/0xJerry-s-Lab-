import { NextResponse, NextRequest } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userSession = request.cookies.get('user_session')?.value;
    const adminSession = request.cookies.get('admin_session')?.value;
    
    if (!userSession && !adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

    let tickets;
    if (adminSession) {
      const ticketsQuery = await db.prepare('SELECT * FROM support_tickets ORDER BY created_at DESC');
      tickets = await ticketsQuery.all();
    } else if (userSession) {
      const decoded = Buffer.from(userSession, 'base64').toString();
      const [email] = decoded.split(':');
      const ticketsQuery = await db.prepare('SELECT * FROM support_tickets WHERE user_email = ? ORDER BY created_at DESC');
      tickets = await ticketsQuery.bind(email).all();
    }

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userSession = request.cookies.get('user_session')?.value;
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = Buffer.from(userSession, 'base64').toString();
    const [email] = decoded.split(':');

    const db = getDatabase();
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

    const body = await request.json();
    const { name, subject, issue } = body;

    if (!name || !subject || !issue) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    const insertQuery = await db.prepare('INSERT INTO support_tickets (user_name, user_email, subject, issue) VALUES (?, ?, ?, ?)');
    await insertQuery.bind(name, email, subject, issue).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
