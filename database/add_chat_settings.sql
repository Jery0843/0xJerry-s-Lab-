-- Chat settings table
CREATE TABLE IF NOT EXISTS chat_settings (
    id INTEGER PRIMARY KEY,
    sudo_chat_enabled INTEGER DEFAULT 1,
    root_chat_enabled INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT OR IGNORE INTO chat_settings (id, sudo_chat_enabled, root_chat_enabled) VALUES (1, 1, 1);
