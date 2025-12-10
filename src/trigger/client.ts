import { configure } from "@trigger.dev/sdk/v3";

export const client = configure({
  secretKey: process.env.TRIGGER_SECRET_KEY!,
});
