-- Add notice popup table
CREATE TABLE IF NOT EXISTS notice_popup (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default notice
INSERT INTO notice_popup (id, title, content, is_active) 
VALUES (1, 'Welcome', 'Welcome to 0xJerry''s Lab!', 0);
