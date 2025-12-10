import { NextResponse, NextRequest } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = getDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const query = await db.prepare('SELECT * FROM chat_settings WHERE id = 1');
    const settings = await query.first();

    return NextResponse.json(settings || { sudo_chat_enabled: 1, root_chat_enabled: 1 });
  } catch (error) {
    console.error('Error fetching chat settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminSession = request.cookies.get('admin_session')?.value;
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const body = await request.json();
    const { sudo_chat_enabled, root_chat_enabled } = body;

    const updateQuery = await db.prepare(
      'UPDATE chat_settings SET sudo_chat_enabled = ?, root_chat_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1'
    );
    await updateQuery.bind(sudo_chat_enabled ? 1 : 0, root_chat_enabled ? 1 : 0).run();

    return NextResponse.json({ success: true, sudo_chat_enabled, root_chat_enabled });
  } catch (error) {
    console.error('Error updating chat settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
