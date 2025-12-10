import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const db = getDatabase();
    if (!db) {
      return NextResponse.json({ background: 'matrix' });
    }

    const stmt = await db.prepare('SELECT active_background FROM background_settings WHERE id = 1');
    const result = await stmt.first() as { active_background: string } | null;

    return NextResponse.json({ 
      background: result?.active_background || 'matrix' 
    });
  } catch (error) {
    console.error('Error fetching background:', error);
    return NextResponse.json({ background: 'matrix' });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;

    if (!sessionToken || sessionToken.length !== 64) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const sessionStmt = await db.prepare(`
      SELECT s.*, u.username 
      FROM admin_sessions s 
      JOIN admin_users u ON s.user_id = u.id 
      WHERE s.token = ? AND s.expires_at > datetime('now') AND s.is_active = 1 AND u.is_active = 1
    `);
    const session = await sessionStmt.bind(sessionToken).first();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { background } = await request.json();

    if (!['snow', 'spring', 'matrix'].includes(background)) {
      return NextResponse.json({ error: 'Invalid background' }, { status: 400 });
    }

    // Create table if not exists
    const createStmt = await db.prepare(`
      CREATE TABLE IF NOT EXISTS background_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        active_background TEXT NOT NULL DEFAULT 'matrix',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CHECK (id = 1)
      )
    `);
    await createStmt.run();

    // Insert or update
    const stmt = await db.prepare(`
      INSERT INTO background_settings (id, active_background, updated_at) 
      VALUES (1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET active_background = ?, updated_at = CURRENT_TIMESTAMP
    `);
    await stmt.bind(background, background).run();

    return NextResponse.json({ success: true, background });
  } catch (error) {
    console.error('Error updating background:', error);
    return NextResponse.json({ error: 'Failed to update background', details: String(error) }, { status: 500 });
  }
}
