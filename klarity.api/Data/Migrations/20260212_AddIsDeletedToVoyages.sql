-- Add is_deleted column to marine.voyages
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = 'is_deleted' AND Object_ID = Object_ID('marine.voyages'))
BEGIN
    ALTER TABLE marine.voyages
    ADD is_deleted BIT NOT NULL DEFAULT 0;
END
GO
