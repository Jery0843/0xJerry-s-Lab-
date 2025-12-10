-- Add is_deleted column to sudo_chat_messages
ALTER TABLE sudo_chat_messages ADD COLUMN is_deleted INTEGER DEFAULT 0;
