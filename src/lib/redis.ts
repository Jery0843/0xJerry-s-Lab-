import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || '',
});

export async function publishMessage(chatType: 'sudo' | 'root', message: any) {
  await redis.publish(`chat:${chatType}`, JSON.stringify(message));
}
