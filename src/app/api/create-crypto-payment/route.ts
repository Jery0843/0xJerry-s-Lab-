import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { amount, tier, email, name } = await request.json();
    
    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }
    
    // Get the origin from the request headers
    const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://0xjerry.jerome.co.in';
    
    const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
    const apiKey = process.env.CRYPTOMUS_API_KEY;
    
    const payload = {
      amount: amount.toString(),
      currency: 'USD',
      order_id: `order_${Date.now()}`,
      url_return: `${origin}/membership`,
      url_callback: 'https://0xjerry.jerome.co.in/api/cryptomus-webhook',
      is_payment_multiple: false,
      lifetime: 3600,
      additional_data: JSON.stringify({
        email,
        name,
        tier
      })
    };
    
    // Create signature for Cryptomus
    const sign = crypto
      .createHash('md5')
      .update(Buffer.from(JSON.stringify(payload)).toString('base64') + apiKey)
      .digest('hex');
    
    const response = await fetch('https://api.cryptomus.com/v1/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': merchantId!,
        'sign': sign
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.state === 0 && data.result?.url) {
      return NextResponse.json({ paymentUrl: data.result.url });
    }
    
    return NextResponse.json({ error: 'Payment creation failed' }, { status: 500 });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Payment creation failed' }, { status: 500 });
  }
}
