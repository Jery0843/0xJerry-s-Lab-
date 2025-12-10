import { NextResponse, NextRequest } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

    const stmt = await db.prepare('SELECT * FROM notice_popup WHERE id = ?');
    const result = await stmt.bind(1).first();

    return NextResponse.json({
      title: result?.title || '',
      content: result?.content || '',
      isActive: Boolean(result?.is_active)
    });
  } catch (error) {
    console.error('Error fetching notice popup:', error);
    return NextResponse.json({ error: 'Failed to fetch notice popup' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminSession = request.cookies.get('admin_session')?.value;
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

    const { title, content, isActive } = await request.json();

    const stmt = await db.prepare(`
      INSERT INTO notice_popup (id, title, content, is_active, updated_at)
      VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        is_active = excluded.is_active,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    await stmt.bind(title, content, isActive ? 1 : 0).run();

    const selectStmt = await db.prepare('SELECT * FROM notice_popup WHERE id = ?');
    const updated = await selectStmt.bind(1).first();

    return NextResponse.json({
      success: true,
      title: updated?.title,
      content: updated?.content,
      isActive: Boolean(updated?.is_active)
    });
  } catch (error) {
    console.error('Error updating notice popup:', error);
    return NextResponse.json({ error: 'Failed to update notice popup' }, { status: 500 });
  }
}
