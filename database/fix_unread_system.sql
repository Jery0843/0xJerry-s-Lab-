-- Drop old column
ALTER TABLE support_tickets DROP COLUMN unread_count;

-- Add separate unread counts for user and admin
ALTER TABLE support_tickets ADD COLUMN user_unread INTEGER DEFAULT 0;
ALTER TABLE support_tickets ADD COLUMN admin_unread INTEGER DEFAULT 0;
