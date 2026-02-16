IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('auth.roles') AND name = 'is_active')
BEGIN
    ALTER TABLE auth.roles ADD is_active bit NOT NULL DEFAULT 1;
END
GO
