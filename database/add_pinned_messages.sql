-- Add pinned column to sudo_chat_messages
ALTER TABLE sudo_chat_messages ADD COLUMN is_pinned INTEGER DEFAULT 0;
