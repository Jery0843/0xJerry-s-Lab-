import { Redis } from '@upstash/redis';

export const runtime = 'edge';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || 'https://optimum-lobster-5918.upstash.io',
  token: process.env.UPSTASH_REDIS_TOKEN || 'ARceAAImcDE2ODQwZjY4MWMwMDY0ZGIwOTA0Yzc5NTE3MTFlNGFkZnAxNTkxOA',
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const chatType = url.searchParams.get('type') || 'sudo';
  
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: 'connected' });

      const channel = `chat:${chatType}`;
      let lastCheck = Date.now();

      const interval = setInterval(async () => {
        try {
          const messages = await redis.lrange(`${channel}:messages`, 0, -1);
          const newMessages = messages
            .map((m: any) => typeof m === 'string' ? JSON.parse(m) : m)
            .filter((m: any) => {
              const msgTime = m.timestamp || new Date(m.created_at).getTime();
              return msgTime > lastCheck;
            });
          
          if (newMessages.length > 0) {
            send({ type: 'update', messages: newMessages });
            lastCheck = Date.now();
          }
        } catch (error) {
          console.error('SSE error:', error);
        }
      }, 300);

      const cleanup = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch (e) {
          // Controller already closed
        }
      };

      request.signal?.addEventListener('abort', cleanup);
      setTimeout(cleanup, 300000); // 5 min timeout
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
