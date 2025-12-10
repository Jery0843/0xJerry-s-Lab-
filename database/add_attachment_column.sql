-- Add attachment_url column to ticket_messages table
ALTER TABLE ticket_messages ADD COLUMN attachment_url TEXT;
ALTER TABLE ticket_messages ADD COLUMN attachment_name TEXT;
