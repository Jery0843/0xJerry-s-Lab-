import { NextResponse, NextRequest } from 'next/server';
import { getDatabase } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const userSession = request.cookies.get('user_session')?.value;
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = Buffer.from(userSession, 'base64').toString();
    const [email] = decoded.split(':');

    const db = getDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const settingsQuery = await db.prepare('SELECT sudo_chat_enabled FROM chat_settings WHERE id = 1');
    const settings = await settingsQuery.first();
    if (settings && settings.sudo_chat_enabled === 0) {
      return NextResponse.json({ error: 'Chat is under maintenance' }, { status: 503 });
    }

    const banQuery = await db.prepare('SELECT * FROM chat_bans WHERE user_email = ?');
    const banned = await banQuery.bind(email).first();
    if (banned) {
      return NextResponse.json({ error: 'You are banned from chat' }, { status: 403 });
    }

    const memberQuery = await db.prepare('SELECT * FROM members WHERE email = ?');
    const member = await memberQuery.bind(email).first();

    if (!member || member.tier_name !== 'Sudo Access') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const after = searchParams.get('after');
    
    let messagesQuery;
    if (after) {
      messagesQuery = await db.prepare(`
        SELECT m.*, 
          (SELECT json_group_array(json_object('emoji', emoji, 'count', count, 'users', users))
           FROM (SELECT emoji, COUNT(*) as count, json_group_array(user_email) as users
                 FROM sudo_chat_reactions WHERE message_id = m.id GROUP BY emoji))
          as reactions
        FROM sudo_chat_messages m WHERE m.created_at > ? ORDER BY m.created_at ASC
      `).bind(after);
    } else {
      messagesQuery = await db.prepare(`
        SELECT m.*, 
          (SELECT json_group_array(json_object('emoji', emoji, 'count', count, 'users', users))
           FROM (SELECT emoji, COUNT(*) as count, json_group_array(user_email) as users
                 FROM sudo_chat_reactions WHERE message_id = m.id GROUP BY emoji))
          as reactions
        FROM sudo_chat_messages m ORDER BY m.created_at ASC LIMIT 50
      `);
    }
    const messages = await messagesQuery.all();

    const pollsQuery = await db.prepare(`
      SELECT p.*, 
        (SELECT json_group_array(json_object('option_index', option_index, 'user_email', user_email))
         FROM sudo_chat_poll_votes WHERE poll_id = p.id) as votes
      FROM sudo_chat_polls p ORDER BY p.created_at DESC LIMIT 20
    `);
    const polls = await pollsQuery.all();

    return NextResponse.json({ messages, polls });
  } catch (error) {
    console.error('Error fetching chat:', error);
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
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const settingsQuery = await db.prepare('SELECT sudo_chat_enabled FROM chat_settings WHERE id = 1');
    const settings = await settingsQuery.first();
    if (settings && settings.sudo_chat_enabled === 0) {
      return NextResponse.json({ error: 'Chat is under maintenance' }, { status: 503 });
    }

    const banQuery = await db.prepare('SELECT * FROM chat_bans WHERE user_email = ?');
    const banned = await banQuery.bind(email).first();
    if (banned) {
      return NextResponse.json({ error: 'You are banned from chat' }, { status: 403 });
    }

    const memberQuery = await db.prepare('SELECT * FROM members WHERE email = ?');
    const member = await memberQuery.bind(email).first();

    if (!member || member.tier_name !== 'Sudo Access') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { type, message, reaction, messageId, poll } = body;

    if (type === 'message') {
      const insertQuery = await db.prepare('INSERT INTO sudo_chat_messages (user_name, user_email, message) VALUES (?, ?, ?) RETURNING *');
      const result = await insertQuery.bind(member.name, email, message).run();
      let newMessage = result.results?.[0];
      if (!newMessage) {
        newMessage = { 
          id: result.meta.last_row_id, 
          user_name: member.name, 
          user_email: email, 
          message, 
          created_at: new Date().toISOString().replace('T', ' ').replace('Z', '')
        };
      }
      
      // Publish to Redis for real-time updates
      const redisMsg = { ...newMessage, timestamp: Date.now() };
      await redis.lpush('chat:sudo:messages', JSON.stringify(redisMsg));
      await redis.ltrim('chat:sudo:messages', 0, 99); // Keep last 100
      
      return NextResponse.json({ success: true, message: newMessage });
    }

    if (type === 'reaction') {
      const insertQuery = await db.prepare('INSERT OR IGNORE INTO sudo_chat_reactions (message_id, user_email, emoji) VALUES (?, ?, ?)');
      await insertQuery.bind(messageId, email, reaction).run();
      return NextResponse.json({ success: true });
    }

    if (type === 'unreact') {
      const deleteQuery = await db.prepare('DELETE FROM sudo_chat_reactions WHERE message_id = ? AND user_email = ? AND emoji = ?');
      await deleteQuery.bind(messageId, email, reaction).run();
      return NextResponse.json({ success: true });
    }

    if (type === 'poll') {
      const insertQuery = await db.prepare('INSERT INTO sudo_chat_polls (user_name, user_email, question, options) VALUES (?, ?, ?, ?)');
      await insertQuery.bind(member.name, email, poll.question, JSON.stringify(poll.options)).run();
      return NextResponse.json({ success: true });
    }

    if (type === 'vote') {
      const insertQuery = await db.prepare('INSERT OR REPLACE INTO sudo_chat_poll_votes (poll_id, user_email, option_index) VALUES (?, ?, ?)');
      await insertQuery.bind(poll.pollId, email, poll.optionIndex).run();
      return NextResponse.json({ success: true });
    }

    if (type === 'pin') {
      const { messageId, pin } = body;
      const updateQuery = await db.prepare('UPDATE sudo_chat_messages SET is_pinned = ? WHERE id = ?');
      await updateQuery.bind(pin ? 1 : 0, messageId).run();
      return NextResponse.json({ success: true });
    }

    if (type === 'delete') {
      const { messageId } = body;
      const updateQuery = await db.prepare('UPDATE sudo_chat_messages SET is_deleted = 1, deleted_by = ?, message = "Message deleted" WHERE id = ? AND user_email = ?');
      await updateQuery.bind(email, messageId, email).run();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error posting to chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
