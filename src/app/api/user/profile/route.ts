import { NextResponse, NextRequest } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userSession = request.cookies.get('user_session')?.value;
    
    if (!userSession) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = Buffer.from(userSession, 'base64').toString();
    const [email] = decoded.split(':');

    const db = getDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const memberStmt = await db.prepare('SELECT email, name, status, source, tier_name, subscribed_at, ip_address, country FROM members WHERE email = ?');
    const member = await memberStmt.bind(email).first();

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        name: member.name || 'Unknown',
        email: member.email,
        country: member.country || 'Unknown',
        ip: member.ip_address || 'Unknown'
      },
      membership: {
        platform: member.source || 'Ko-fi',
        tier_name: member.tier_name || 'Premium',
        status: member.status || 'active',
        subscribed_at: member.subscribed_at ? new Date(member.subscribed_at).toISOString().split('T')[0] : 'N/A'
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}