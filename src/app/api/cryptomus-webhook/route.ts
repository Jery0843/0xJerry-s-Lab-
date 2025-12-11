import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDatabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiKey = process.env.CRYPTOMUS_API_KEY;
    
    // Verify webhook signature (skip in development)
    if (process.env.NODE_ENV === 'production') {
      // Optional: Verify Cryptomus IP (add their IPs to whitelist)
      const clientIP = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for');
      console.log('Webhook from IP:', clientIP);
      
      const sign = request.headers.get('sign');
      const expectedSign = crypto
        .createHash('md5')
        .update(Buffer.from(JSON.stringify(body)).toString('base64') + apiKey)
        .digest('hex');
      
      if (!sign) {
        console.log('❌ Missing signature');
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }
      
      if (sign !== expectedSign) {
        console.log('❌ Invalid signature');
        console.log('Expected:', expectedSign);
        console.log('Received:', sign);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      
      console.log('✅ Signature verified');
    } else {
      console.log('🧪 DEV MODE: Skipping signature verification');
    }
    
    // Payment successful
    if (body.status === 'paid' || body.status === 'paid_over') {
      const additionalData = JSON.parse(body.additional_data || '{}');
      const { email, name, tier } = additionalData;
      
      console.log('Payment received:', {
        orderId: body.order_id,
        amount: body.amount,
        email,
        name,
        tier
      });
      
      // Add/update member in database with 29-day expiry
      const db = getDatabase();
      if (db) {
        const stmt = await db.prepare(`
          INSERT INTO members (email, name, tier_name, status, source, subscribed_at, expiry_date)
          VALUES (?, ?, ?, 'active', 'crypto', datetime('now'), datetime('now', '+29 days'))
          ON CONFLICT(email) DO UPDATE SET
            name = excluded.name,
            tier_name = excluded.tier_name,
            status = 'active',
            source = 'crypto',
            subscribed_at = datetime('now'),
            expiry_date = datetime('now', '+29 days')
        `);
        
        await stmt.bind(email, name, tier).run();
        console.log('✅ Member saved with 29-day expiry:', email);
      }
      
      return NextResponse.json({ status: 'success' });
    }
    
    return NextResponse.json({ status: 'received' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
