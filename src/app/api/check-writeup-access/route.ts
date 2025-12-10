import { NextResponse, NextRequest } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { writeupId, type } = await request.json();
    
    const db = getDatabase();
    if (!db) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: 'service_unavailable',
        message: 'Service temporarily unavailable'
      }, { status: 503 });
    }

    // Check writeup is_active status FIRST before requiring login
    let writeupStmt;
    if (type === 'htb') {
      writeupStmt = await db.prepare('SELECT access_tier, is_active FROM htb_machines WHERE id = ?');
    } else if (type === 'ctf') {
      writeupStmt = await db.prepare('SELECT access_tier, is_active FROM ctf_writeups WHERE id = ?');
    } else {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: 'invalid_type',
        message: 'Invalid writeup type'
      }, { status: 400 });
    }

    const writeup = await writeupStmt.bind(writeupId).first();

    if (!writeup) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: 'writeup_not_found',
        message: 'Writeup not found'
      }, { status: 404 });
    }

    // If writeup is not active (is_active = 0), grant free access WITHOUT login
    if (!writeup.is_active) {
      let writeupContentStmt;
      if (type === 'htb') {
        writeupContentStmt = await db.prepare('SELECT * FROM htb_machines WHERE id = ?');
      } else {
        writeupContentStmt = await db.prepare('SELECT * FROM ctf_writeups WHERE id = ?');
      }
      
      const fullWriteup = await writeupContentStmt.bind(writeupId).first();
      
      return NextResponse.json({ 
        hasAccess: true,
        userTier: 'Free',
        requiredTier: 'None',
        writeup: fullWriteup
      });
    }

    // For active writeups, require login and membership
    const userSession = request.cookies.get('user_session')?.value;
    
    if (!userSession) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: 'not_logged_in',
        message: 'Please login with your membership email to access writeups'
      }, { status: 401 });
    }

    // Decode session token (email:timestamp)
    const decoded = Buffer.from(userSession, 'base64').toString();
    const [email, timestamp] = decoded.split(':');
    
    // Check if session is expired (24 hours)
    const sessionTime = parseInt(timestamp);
    const now = Date.now();
    const sessionDuration = 24 * 60 * 60 * 1000;
    
    if (now - sessionTime > sessionDuration) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: 'session_expired',
        message: 'Your session has expired. Please login again'
      }, { status: 401 });
    }

    // Get member details
    const memberStmt = await db.prepare('SELECT * FROM members WHERE email = ? AND status = ?');
    const member = await memberStmt.bind(email, 'active').first();

    if (!member) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: 'no_active_membership',
        message: 'No active membership found for your account'
      }, { status: 403 });
    }

    const userTierName = member.tier_name || 'Premium';

    const requiredTier = writeup.access_tier || 'Both';

    // Check access logic
    const hasAccess = checkAccess(userTierName, requiredTier);

    if (!hasAccess) {
      return NextResponse.json({ 
        hasAccess: false, 
        reason: 'insufficient_tier',
        message: `This writeup requires "${requiredTier}" access. You have "${userTierName}" tier.`,
        requiredTier,
        userTier: userTierName
      }, { status: 403 });
    }

    // If access granted, fetch and return the writeup content
    let writeupContentStmt;
    if (type === 'htb') {
      writeupContentStmt = await db.prepare('SELECT * FROM htb_machines WHERE id = ?');
    } else {
      writeupContentStmt = await db.prepare('SELECT * FROM ctf_writeups WHERE id = ?');
    }
    
    const fullWriteup = await writeupContentStmt.bind(writeupId).first();
    
    return NextResponse.json({ 
      hasAccess: true,
      userTier: userTierName,
      requiredTier,
      writeup: fullWriteup
    });

  } catch (error) {
    console.error('Error checking writeup access:', error);
    return NextResponse.json({ 
      hasAccess: false, 
      reason: 'server_error',
      message: 'An error occurred while checking access'
    }, { status: 500 });
  }
}

function checkAccess(userTierName: string, requiredTier: string): boolean {
  // Map tier names to access levels
  // Sudo Access tier can access Sudo Access writeups
  // Root Access tier can access Root Access writeups  
  // Both tier can access everything
  
  if (requiredTier === 'Both') {
    return userTierName === 'Sudo Access' || userTierName === 'Root Access' || userTierName === 'Both';
  }
  
  if (requiredTier === 'Sudo Access') {
    return userTierName === 'Sudo Access' || userTierName === 'Both';
  }
  
  if (requiredTier === 'Root Access') {
    return userTierName === 'Root Access' || userTierName === 'Both';
  }
  
  return false;
}
