import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{
          role: 'user',
          content: `Search for the latest CVEs published TODAY (${today}). Find at least 10 most recent critical/high severity CVEs from the last 24 hours.

Return JSON array ONLY:
[{
  "id": "CVE-YYYY-XXXXX",
  "description": "Brief technical description",
  "severity": "CRITICAL/HIGH/MEDIUM/LOW",
  "score": 9.8,
  "publishedDate": "2025-01-XX",
  "affectedProducts": ["Product name"],
  "references": ["https://nvd.nist.gov/vuln/detail/CVE-YYYY-XXXXX"]
}]

Focus on: RCE, authentication bypass, privilege escalation, SQL injection vulnerabilities.`
        }],
        temperature: 0.2,
        max_tokens: 2000
      })
    });

    if (perplexityResponse.ok) {
      const data = await perplexityResponse.json();
      const content = data.choices[0]?.message?.content || '[]';
      const cves = JSON.parse(content.replace(/```json\n?|```/g, '').trim());
      
      return NextResponse.json(cves.map((cve: any) => ({
        id: cve.id,
        title: cve.id,
        description: cve.description,
        severity: cve.severity,
        score: cve.score,
        publishedDate: cve.publishedDate,
        lastModified: cve.publishedDate,
        references: cve.references || [],
        affectedProducts: cve.affectedProducts || []
      })));
    }

    throw new Error('Perplexity failed');
  } catch (error) {
    console.error('AI CVE fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch latest CVEs' }, { status: 500 });
  }
}
