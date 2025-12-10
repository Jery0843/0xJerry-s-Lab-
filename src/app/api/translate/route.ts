import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese',
  ja: 'Japanese',
  ru: 'Russian',
  ar: 'Arabic',
  pt: 'Portuguese',
  hi: 'Hindi'
};

export async function POST(request: NextRequest) {
  try {
    const { content, targetLang, contentType } = await request.json();
    
    if (!content || !targetLang) {
      return NextResponse.json({ error: 'Missing content or targetLang' }, { status: 400 });
    }

    if (!SUPPORTED_LANGUAGES[targetLang as keyof typeof SUPPORTED_LANGUAGES]) {
      return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
    }

    // Split content into chunks (Groq has token limits)
    const chunks = splitIntoChunks(content, 3000);
    const translatedChunks = [];

    for (const chunk of chunks) {
      let translatedChunk = chunk;
      let success = false;
      
      try {
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
                content: `You are a technical translator specializing in cybersecurity content. Translate the following ${contentType || 'writeup'} to ${SUPPORTED_LANGUAGES[targetLang as keyof typeof SUPPORTED_LANGUAGES]}.

CRITICAL RULES:
1. Keep ALL technical terms in English (commands, code, tool names, CVEs)
2. Keep ALL code blocks unchanged
3. Keep ALL URLs and links unchanged
4. Preserve markdown formatting
5. Translate only explanatory text
6. Maintain technical accuracy

Examples:
- "Run nmap scan" → "Ejecutar escaneo nmap" (Spanish)
- "Use sqlmap tool" → "Utiliser l'outil sqlmap" (French)
- Code blocks stay exactly the same`
              },
              {
                role: 'user',
                content: chunk
              }
            ],
            temperature: 0.2,
            max_tokens: 4000
          })
        });

        if (groqResponse.ok) {
          const data = await groqResponse.json();
          translatedChunk = data.choices[0]?.message?.content || chunk;
          success = true;
        } else {
          const errorData = await groqResponse.json();
          if (errorData.error?.code === 'rate_limit_exceeded') {
            console.log('Groq rate limit, trying fallback model llama-3.1-8b-instant...');
            const groqFallbackResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
                    content: `Translate to ${SUPPORTED_LANGUAGES[targetLang as keyof typeof SUPPORTED_LANGUAGES]}. Keep technical terms, code blocks, URLs unchanged. Only translate explanatory text.`
                  },
                  {
                    role: 'user',
                    content: chunk
                  }
                ],
                temperature: 0.2,
                max_tokens: 4000
              })
            });
            
            if (groqFallbackResponse.ok) {
              const data = await groqFallbackResponse.json();
              translatedChunk = data.choices[0]?.message?.content || chunk;
              success = true;
              console.log('✓ Translation successful using Groq llama-3.1-8b-instant');
            } else {
              throw new Error('Groq fallback failed');
            }
          } else {
            throw new Error('Groq API failed');
          }
        }
      } catch (groqError) {
        if (!success) {
          console.log('Groq failed, trying Perplexity fallback...');
        
        try {
          const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'sonar',
              messages: [
                {
                  role: 'system',
                  content: `Translate to ${SUPPORTED_LANGUAGES[targetLang as keyof typeof SUPPORTED_LANGUAGES]}. Keep technical terms, code blocks, URLs unchanged. Only translate explanatory text.`
                },
                {
                  role: 'user',
                  content: chunk
                }
              ],
              temperature: 0.2,
              max_tokens: 4000
            })
          });

          if (perplexityResponse.ok) {
            const data = await perplexityResponse.json();
            translatedChunk = data.choices[0]?.message?.content || chunk;
            success = true;
            console.log('✓ Translation successful using Perplexity sonar');
          } else {
            throw new Error('Perplexity API failed');
          }
        } catch (perplexityError) {
          console.log('Perplexity failed, trying Gemini fallback...');
        }
          
          try {
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: `Translate to ${SUPPORTED_LANGUAGES[targetLang as keyof typeof SUPPORTED_LANGUAGES]}. Keep technical terms, code blocks, URLs unchanged. Only translate explanatory text:\n\n${chunk}`
                  }]
                }],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 4000
                }
              })
            });

            if (geminiResponse.ok) {
              const geminiData = await geminiResponse.json();
              translatedChunk = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || chunk;
              success = true;
              console.log('✓ Translation successful using Gemini 2.0-flash-exp');
            } else {
              throw new Error('Gemini API failed');
            }
          } catch (geminiError) {
            console.error('All APIs failed');
            return NextResponse.json({ error: 'Translation failed - all APIs unavailable' }, { status: 503 });
          }
        }
      }
      
      translatedChunks.push(translatedChunk);
    }

    return NextResponse.json({ 
      translatedContent: translatedChunks.join('\n\n'),
      language: targetLang,
      languageName: SUPPORTED_LANGUAGES[targetLang as keyof typeof SUPPORTED_LANGUAGES]
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}

function splitIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split('\n\n');
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxLength) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}
