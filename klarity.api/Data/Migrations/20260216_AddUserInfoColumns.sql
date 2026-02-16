-- Add email to auth.users (name is already account_name)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('auth.users') AND name = 'email')
BEGIN
    ALTER TABLE auth.users ADD email NVARCHAR(255) NULL;
END
GO
