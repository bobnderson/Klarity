-- Fix missing columns in aviation.movement_requests
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('aviation.movement_requests') AND name = 'trip_type')
BEGIN
    ALTER TABLE aviation.movement_requests ADD trip_type NVARCHAR(20) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('aviation.movement_requests') AND name = 'selected_flight_id')
BEGIN
    ALTER TABLE aviation.movement_requests ADD selected_flight_id NVARCHAR(50) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('aviation.movement_requests') AND name = 'return_flight_id')
BEGIN
    ALTER TABLE aviation.movement_requests ADD return_flight_id NVARCHAR(50) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('aviation.movement_requests') AND name = 'approver_id')
BEGIN
    ALTER TABLE aviation.movement_requests ADD approver_id NVARCHAR(100) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('aviation.movement_requests') AND name = 'approved_at')
BEGIN
    ALTER TABLE aviation.movement_requests ADD approved_at DATETIME NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('aviation.movement_requests') AND name = 'approver_comments')
BEGIN
    ALTER TABLE aviation.movement_requests ADD approver_comments NVARCHAR(MAX) NULL;
END

-- Check for missing columns in aviation.movement_request_items if any
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('aviation.movement_request_items') AND name = 'weight')
BEGIN
    ALTER TABLE aviation.movement_request_items ADD weight DECIMAL(18, 2) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('aviation.movement_request_items') AND name = 'description')
BEGIN
    ALTER TABLE aviation.movement_request_items ADD description NVARCHAR(255) NULL;
END
GO
