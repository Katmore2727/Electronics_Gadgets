-- Add assigned_admin_id to users table for admin-user assignment
ALTER TABLE users ADD COLUMN assigned_admin_id BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_assigned_admin ON users(assigned_admin_id);

-- Update existing users: assign all customers to the first admin if exists
-- This is optional; in production, you'd assign users through the admin panel
DO $$
DECLARE
    first_admin_id BIGINT;
BEGIN
    SELECT id INTO first_admin_id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1;
    IF first_admin_id IS NOT NULL THEN
        UPDATE users SET assigned_admin_id = first_admin_id WHERE role = 'customer' AND assigned_admin_id IS NULL;
    END IF;
END $$;