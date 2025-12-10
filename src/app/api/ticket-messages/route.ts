import { NextResponse, NextRequest } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const ticketId = request.nextUrl.searchParams.get('ticketId');
    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });
    }

    const db = getDatabase();
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

    const messagesQuery = await db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC');
    const messages = await messagesQuery.bind(ticketId).all();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userSession = request.cookies.get('user_session')?.value;
    const adminSession = request.cookies.get('admin_session')?.value;

    if (!userSession && !adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

    const body = await request.json();
    const { ticketId, message, type, attachmentUrl, attachmentName } = body;

    if (type === 'close' && adminSession) {
      const updateQuery = await db.prepare('UPDATE support_tickets SET status = ? WHERE id = ?');
      await updateQuery.bind('closed', ticketId).run();
      return NextResponse.json({ success: true });
    }

    if (type === 'markRead') {
      // Reset unread count based on who is viewing
      const column = adminSession ? 'admin_unread' : 'user_unread';
      const updateQuery = await db.prepare(`UPDATE support_tickets SET ${column} = 0 WHERE id = ?`);
      await updateQuery.bind(ticketId).run();
      return NextResponse.json({ success: true });
    }

    let senderEmail, senderName;
    if (adminSession) {
      const sessionStmt = await db.prepare('SELECT u.username FROM admin_sessions s JOIN admin_users u ON s.user_id = u.id WHERE s.token = ?');
      const admin = await sessionStmt.bind(adminSession).first();
      senderEmail = 'admin';
      senderName = admin?.username || 'Admin';
    } else if (userSession) {
      const decoded = Buffer.from(userSession, 'base64').toString();
      const [email] = decoded.split(':');
      const memberQuery = await db.prepare('SELECT name FROM members WHERE email = ?');
      const member = await memberQuery.bind(email).first();
      senderEmail = email;
      senderName = member?.name || 'User';
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const insertQuery = await db.prepare('INSERT INTO ticket_messages (ticket_id, sender_email, sender_name, message, attachment_url, attachment_name) VALUES (?, ?, ?, ?, ?, ?)');
    await insertQuery.bind(ticketId, senderEmail, senderName, message, attachmentUrl || null, attachmentName || null).run();

    // Increment unread count for the recipient
    if (adminSession) {
      // Admin sent message, increment user_unread
      const updateQuery = await db.prepare('UPDATE support_tickets SET user_unread = user_unread + 1 WHERE id = ?');
      await updateQuery.bind(ticketId).run();
    } else {
      // User sent message, increment admin_unread
      const updateQuery = await db.prepare('UPDATE support_tickets SET admin_unread = admin_unread + 1 WHERE id = ?');
      await updateQuery.bind(ticketId).run();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error posting message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
