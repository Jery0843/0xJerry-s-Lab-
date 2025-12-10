import { NextResponse, NextRequest } from 'next/server';
import { getDatabase, HTBMachinesDB, CTFWriteupsDB } from '@/lib/db';

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

    const memberQuery = await db.prepare('SELECT * FROM members WHERE email = ?');
    const member = await memberQuery.bind(email).first();

    if (!member || member.tier_name !== 'Sudo Access') {
      return NextResponse.json({ error: 'Access denied. Sudo Access tier required.' }, { status: 403 });
    }

    const htbMachinesDB = new HTBMachinesDB(db);
    const allHtbMachines = await htbMachinesDB.getAllMachines();
    const htbWriteups = allHtbMachines
      .filter(m => m.md_download_link)
      .map(m => ({
        id: m.id,
        name: m.name,
        type: 'HTB',
        downloadLink: m.md_download_link,
        date: m.date_completed
      }));

    const ctfWriteupsDB = new CTFWriteupsDB(db);
    const allCtfWriteups = await ctfWriteupsDB.getAllWriteups();
    const ctfWriteups = allCtfWriteups
      .filter(w => w.md_download_link)
      .map(w => ({
        id: w.id,
        name: w.title,
        type: 'CTF',
        downloadLink: w.md_download_link,
        date: w.created_at
      }));

    const allWriteups = [...htbWriteups, ...ctfWriteups].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return NextResponse.json({
      writeups: allWriteups
    });
  } catch (error) {
    console.error('Error fetching downloadable writeups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
