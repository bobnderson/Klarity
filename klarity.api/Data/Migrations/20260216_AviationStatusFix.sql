-- Migration to fix missing status column in aviation.movement_request_items
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('aviation.movement_request_items') 
    AND name = 'status'
)
BEGIN
    ALTER TABLE aviation.movement_request_items ADD status VARCHAR(50) DEFAULT 'Approved';
END
GO
