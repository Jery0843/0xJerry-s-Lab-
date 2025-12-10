import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { cveId, description, severity, affectedProducts } = await request.json();
    
    // Use Perplexity to get real-time context about the CVE
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
          content: `Search for detailed information about ${cveId}. Find: exploitation methods, proof of concepts, affected versions, patches, and real-world attacks. Provide technical details.`
        }],
        temperature: 0.2,
        max_tokens: 1000
      })
    });

    let additionalContext = '';
    if (perplexityResponse.ok) {
      const perplexityData = await perplexityResponse.json();
      additionalContext = perplexityData.choices[0]?.message?.content || '';
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a technical security researcher. Write factual, concise vulnerability writeups based on CVE data. Be direct and technical. No dramatic language or fluff.'
          },
          {
            role: 'user',
            content: `Write a technical writeup for this CVE:

CVE: ${cveId}
Description: ${description}
Severity: ${severity}
Affected: ${affectedProducts.slice(0, 3).join(', ')}

Additional Research:
${additionalContext}

Format:

# ${cveId}

## Summary
[1-2 sentences describing the vulnerability]

## Details
- CVE: ${cveId}
- Severity: ${severity}
- Affected: ${affectedProducts.slice(0, 3).join(', ')}
- Type: [vulnerability type from description]

## Technical Description
[Explain the vulnerability technically based on the description]

## Exploitation
\`\`\`bash
# Reconnaissance
nmap -sV <target>

# Exploitation
[actual commands based on vulnerability type]
\`\`\`

## Impact
[Describe what attacker can achieve]

## Mitigation
- Apply security patches
- [Specific fixes based on vulnerability]

## References
- https://nvd.nist.gov/vuln/detail/${cveId}

Be factual and technical. Base everything on the CVE description provided.`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (groqResponse.ok) {
      const data = await groqResponse.json();
      return NextResponse.json({ template: data.choices[0]?.message?.content || '' });
    }
    
    throw new Error('Groq failed');
  } catch (error) {
    return NextResponse.json({ template: `# CVE Writeup Template\n\nTemplate generation failed. Please try again.` }, { status: 500 });
  }
}
