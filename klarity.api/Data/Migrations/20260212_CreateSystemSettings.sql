-- Create system schema if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'system')
BEGIN
    EXEC('CREATE SCHEMA system');
END
GO

-- Create settings table
    updated_by VARCHAR(100)
);

-- Seed initial SMTP settings (disabled by default)
INSERT INTO system.settings (key, value, description, "group") VALUES
('SMTP_Enabled', 'false', 'Enable or disable email notifications', 'SMTP'),
('SMTP_Server', '', 'SMTP Server Address', 'SMTP'),
('SMTP_Port', '587', 'SMTP Port', 'SMTP'),
('SMTP_Username', '', 'SMTP Username', 'SMTP'),
('SMTP_Password', '', 'SMTP Password', 'SMTP'),
('SMTP_EnableSSL', 'true', 'Enable SSL/TLS', 'SMTP'),
('SMTP_SenderEmail', 'notifications@klarity.com', 'Sender Email Address', 'SMTP'),
('SMTP_Domain', 'shell.com', 'Domain for resolving samAccountName', 'SMTP')
ON CONFLICT (key) DO NOTHING;
