-- Add is_deleted column to marine.movement_requests
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = 'is_deleted' AND Object_ID = Object_ID('marine.movement_requests'))
BEGIN
    ALTER TABLE marine.movement_requests
    ADD is_deleted BIT NOT NULL DEFAULT 0;
END
GO
