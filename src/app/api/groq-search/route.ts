import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    console.log('Groq search query:', query);
    
    const [htbRes, thmRes, ctfRes] = await Promise.all([
      fetch(`${request.nextUrl.origin}/api/admin/htb-machines-d1`),
      fetch(`${request.nextUrl.origin}/api/admin/thm-rooms-d1`),
      fetch(`${request.nextUrl.origin}/api/admin/ctf-writeups-d1`)
    ]);
    
    const [htbData, thmData, ctfData] = await Promise.all([
      htbRes.json(),
      thmRes.json(),
      ctfRes.json()
    ]);
    
    const htbMachines = Array.isArray(htbData) ? htbData : htbData.machines || [];
    const thmRooms = Array.isArray(thmData) ? thmData : thmData.rooms || [];
    const ctfWriteups = Array.isArray(ctfData) ? ctfData : ctfData.writeups || [];
    
    // Sort by date to get latest
    const sortByDate = (arr: any[]) => arr.sort((a, b) => {
      const dateA = new Date(a.date_completed || a.created_at || 0).getTime();
      const dateB = new Date(b.date_completed || b.created_at || 0).getTime();
      return dateB - dateA;
    });
    
    const context = {
      htb: sortByDate([...htbMachines]).map((m: any) => ({ id: m.id, name: m.name, tags: m.tags, difficulty: m.difficulty, date: m.date_completed || m.created_at })),
      thm: sortByDate([...thmRooms]).map((r: any) => ({ slug: r.slug, name: r.name, tags: r.tags, difficulty: r.difficulty, date: r.date_completed || r.created_at })),
      ctf: sortByDate([...ctfWriteups]).map((w: any) => ({ slug: w.slug, title: w.title, ctf_name: w.ctf_name, category: w.category, difficulty: w.difficulty, date: w.date_completed || w.created_at }))
    };
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Search assistant for cybersecurity writeups. Match user query to available content.

Data:
HTB: ${JSON.stringify(context.htb)}
THM: ${JSON.stringify(context.thm)}
CTF: ${JSON.stringify(context.ctf)}

Rules:
1. "latest/newest" → first item from category
2. Exact/partial name match → return URL (case-insensitive, fuzzy match)
3. CTF platform search: "picoctf", "hackthebox ctf", etc → match by ctf_name field
4. "insane/hard/medium/easy" + "ctf" → search CTF array by difficulty
5. "insane/hard/medium/easy" + "machine" → search HTB/THM by difficulty
6. Category search: "web", "crypto", "forensics" → match CTF by category
7. Search ALL items
8. No match → suggest similar from same category

Output JSON only:
{"url": "/machines/htb/ID" or "/machines/thm/SLUG" or "/ctf/SLUG" or null, "suggestion": "message"}`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errorText);
      throw new Error('Groq API failed');
    }
    
    const groqData = await groqResponse.json();
    const content = groqData.choices[0]?.message?.content;
    console.log('Groq response:', content);
    
    try {
      const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
      const result = JSON.parse(cleanContent);
      console.log('Parsed result:', result);
      return NextResponse.json(result);
    } catch (e) {
      console.error('Parse error:', e);
      return NextResponse.json({ url: null });
    }
  } catch (error) {
    console.error('Groq search error:', error);
    return NextResponse.json({ url: null }, { status: 500 });
  }
}
