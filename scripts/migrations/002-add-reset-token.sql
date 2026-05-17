-- Add password reset columns to nexik_org_members
-- Run this migration if table already exists

ALTER TABLE nexik_org_members 
ADD COLUMN IF NOT EXISTS reset_token TEXT;

ALTER TABLE nexik_org_members 
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;

-- Index for faster token lookup
CREATE INDEX IF NOT EXISTS idx_nexik_members_reset_token 
ON nexik_org_members(reset_token) 
WHERE reset_token IS NOT NULL;

SELECT 'Password reset columns added successfully!' as status;
