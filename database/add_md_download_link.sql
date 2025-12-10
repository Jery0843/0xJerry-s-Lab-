-- Add md_download_link column to htb_machines table
ALTER TABLE htb_machines ADD COLUMN md_download_link TEXT;

-- Add md_download_link column to ctf_writeups table
ALTER TABLE ctf_writeups ADD COLUMN md_download_link TEXT;
