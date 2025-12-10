-- Sudo Community Chat Messages
CREATE TABLE IF NOT EXISTS sudo_chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Message Reactions
CREATE TABLE IF NOT EXISTS sudo_chat_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    user_email TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES sudo_chat_messages(id) ON DELETE CASCADE,
    UNIQUE(message_id, user_email, emoji)
);

-- Polls
CREATE TABLE IF NOT EXISTS sudo_chat_polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Poll Votes
CREATE TABLE IF NOT EXISTS sudo_chat_poll_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER NOT NULL,
    user_email TEXT NOT NULL,
    option_index INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES sudo_chat_polls(id) ON DELETE CASCADE,
    UNIQUE(poll_id, user_email)
);
