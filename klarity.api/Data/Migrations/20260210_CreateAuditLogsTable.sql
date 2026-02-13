IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'auth')
BEGIN
    EXEC('CREATE SCHEMA auth')
END
GO

CREATE TABLE auth.audit_logs (
    log_id INT IDENTITY(1,1) PRIMARY KEY,
    account_name NVARCHAR(256),
    action NVARCHAR(256),
    is_successful BIT,
    time_stamp DATETIME DEFAULT GETDATE(),
    request_body NVARCHAR(MAX),
    controller NVARCHAR(256),
    error NVARCHAR(MAX)
);
GO
