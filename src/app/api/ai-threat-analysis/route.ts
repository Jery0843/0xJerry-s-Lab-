import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { cveData } = await request.json();
    
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{
          role: 'user',
          content: `Analyze this CVE and provide:
1. Attack vector (one word: Remote/Local/Physical)
2. Exploit difficulty (Easy/Medium/Hard)
3. Impact summary (15 words max)

CVE: ${cveData.id}
Description: ${cveData.description}
Severity: ${cveData.severity}

Return JSON only: {"attackVector":"","difficulty":"","impact":""}`
        }],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (groqResponse.ok) {
      const data = await groqResponse.json();
      const analysis = JSON.parse(data.choices[0]?.message?.content || '{}');
      return NextResponse.json(analysis);
    }
    
    return NextResponse.json({ attackVector: 'Unknown', difficulty: 'Unknown', impact: 'Analysis unavailable' });
  } catch (error) {
    return NextResponse.json({ attackVector: 'Unknown', difficulty: 'Unknown', impact: 'Analysis failed' });
  }
}
