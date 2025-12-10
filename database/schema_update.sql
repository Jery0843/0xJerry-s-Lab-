-- Add access_tier column to htb_machines
ALTER TABLE htb_machines ADD COLUMN access_tier TEXT DEFAULT 'Both' CHECK (access_tier IN ('Sudo Access', 'Root Access', 'Both'));

-- Add access_tier column to ctf_writeups
ALTER TABLE ctf_writeups ADD COLUMN access_tier TEXT DEFAULT 'Both' CHECK (access_tier IN ('Sudo Access', 'Root Access', 'Both'));

-- Add access_level column to members
ALTER TABLE members ADD COLUMN access_level TEXT DEFAULT 'Both' CHECK (access_level IN ('Sudo Access', 'Root Access', 'Both'));
