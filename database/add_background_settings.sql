-- Background settings table
CREATE TABLE IF NOT EXISTS background_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  active_background TEXT NOT NULL DEFAULT 'matrix',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK (id = 1)
);

-- Insert default background
INSERT OR IGNORE INTO background_settings (id, active_background) VALUES (1, 'matrix');
