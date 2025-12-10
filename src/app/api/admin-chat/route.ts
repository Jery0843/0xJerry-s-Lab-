import { NextResponse, NextRequest } from 'next/server';
import { getDatabase } from '@/lib/db';

async function validateAdmin(token: string) {
  const db = getDatabase();
  if (!db) return null;
  const sessionStmt = await db.prepare('SELECT s.*, u.username FROM admin_sessions s JOIN admin_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime("now") AND s.is_active = 1 AND u.is_active = 1');
  return await sessionStmt.bind(token).first();
}

export async function GET(request: NextRequest) {
  try {
    const adminSession = request.cookies.get('admin_session')?.value;
    if (!adminSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await validateAdmin(adminSession);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const chatType = request.nextUrl.searchParams.get('type');
    if (!chatType || !['sudo', 'root'].includes(chatType)) {
      return NextResponse.json({ error: 'Invalid chat type' }, { status: 400 });
    }

    const db = getDatabase();
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

    const table = chatType === 'sudo' ? 'sudo_chat_messages' : 'root_chat_messages';
    const reactionsTable = chatType === 'sudo' ? 'sudo_chat_reactions' : 'root_chat_reactions';
    const pollsTable = chatType === 'sudo' ? 'sudo_chat_polls' : 'root_chat_polls';
    const votesTable = chatType === 'sudo' ? 'sudo_chat_poll_votes' : 'root_chat_poll_votes';

    const messagesQuery = await db.prepare(`
      SELECT m.*, 
        (SELECT json_group_array(json_object('emoji', emoji, 'count', count, 'users', users))
         FROM (SELECT emoji, COUNT(*) as count, json_group_array(user_email) as users
               FROM ${reactionsTable} WHERE message_id = m.id GROUP BY emoji))
        as reactions
      FROM ${table} m ORDER BY m.created_at ASC LIMIT 100
    `);
    const messages = await messagesQuery.all();

    const pollsQuery = await db.prepare(`
      SELECT p.*, 
        (SELECT json_group_array(json_object('option_index', option_index, 'user_email', user_email))
         FROM ${votesTable} WHERE poll_id = p.id) as votes
      FROM ${pollsTable} p ORDER BY p.created_at DESC LIMIT 20
    `);
    const polls = await pollsQuery.all();

    return NextResponse.json({ messages, polls });
  } catch (error) {
    console.error('Error fetching admin chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminSession = request.cookies.get('admin_session')?.value;
    if (!adminSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await validateAdmin(adminSession);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { type, chatType, message, messageId, userEmail, reason } = body;

    if (!chatType || !['sudo', 'root'].includes(chatType)) {
      return NextResponse.json({ error: 'Invalid chat type' }, { status: 400 });
    }

    const db = getDatabase();
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

    const table = chatType === 'sudo' ? 'sudo_chat_messages' : 'root_chat_messages';

    if (type === 'message') {
      const insertQuery = await db.prepare(`INSERT INTO ${table} (user_name, user_email, message) VALUES (?, ?, ?)`);
      await insertQuery.bind(`👑 ${admin.username}`, `admin@${admin.username}`, message).run();
      return NextResponse.json({ success: true });
    }

    if (type === 'adminDelete') {
      const updateQuery = await db.prepare(`UPDATE ${table} SET is_deleted = 1, deleted_by = ?, message = ? WHERE id = ?`);
      await updateQuery.bind(`admin@${admin.username}`, `Admin deleted this message`, messageId).run();
      return NextResponse.json({ success: true });
    }

    if (type === 'ban') {
      const banQuery = await db.prepare('INSERT OR REPLACE INTO chat_bans (user_email, banned_by, reason) VALUES (?, ?, ?)');
      await banQuery.bind(userEmail, `admin@${admin.username}`, reason || 'No reason provided').run();
      return NextResponse.json({ success: true });
    }

    if (type === 'unban') {
      const unbanQuery = await db.prepare('DELETE FROM chat_bans WHERE user_email = ?');
      await unbanQuery.bind(userEmail).run();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error in admin chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
