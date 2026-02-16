-- Add status column to aviation.movement_request_items
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('aviation.movement_request_items') AND name = 'status')
BEGIN
    ALTER TABLE aviation.movement_request_items ADD status NVARCHAR(50) DEFAULT 'Pending' WITH VALUES;
END
GO
