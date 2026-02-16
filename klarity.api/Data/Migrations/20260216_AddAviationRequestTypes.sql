-- Create aviation.request_types table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'request_types' AND s.name = 'aviation')
BEGIN
    CREATE TABLE aviation.request_types (
        request_type_id VARCHAR(50) PRIMARY KEY,
        request_type NVARCHAR(100) NOT NULL
    );
END
GO

-- Insert aviation-specific request types
-- We use a merge-like approach to avoid duplicates if re-run
IF NOT EXISTS (SELECT 1 FROM aviation.request_types WHERE request_type_id = 'crew-change')
    INSERT INTO aviation.request_types (request_type_id, request_type) VALUES ('crew-change', 'Crew Change');

IF NOT EXISTS (SELECT 1 FROM aviation.request_types WHERE request_type_id = 'medevac')
    INSERT INTO aviation.request_types (request_type_id, request_type) VALUES ('medevac', 'Medical Evacuation (Medevac)');

IF NOT EXISTS (SELECT 1 FROM aviation.request_types WHERE request_type_id = 'vip-flight')
    INSERT INTO aviation.request_types (request_type_id, request_type) VALUES ('vip-flight', 'VIP / Executive');

IF NOT EXISTS (SELECT 1 FROM aviation.request_types WHERE request_type_id = 'field-inspection')
    INSERT INTO aviation.request_types (request_type_id, request_type) VALUES ('field-inspection', 'Field Inspection');

IF NOT EXISTS (SELECT 1 FROM aviation.request_types WHERE request_type_id = 'cargo-delivery')
    INSERT INTO aviation.request_types (request_type_id, request_type) VALUES ('cargo-delivery', 'Cargo / Equipment Delivery');

IF NOT EXISTS (SELECT 1 FROM aviation.request_types WHERE request_type_id = 'offshore-delivery')
    INSERT INTO aviation.request_types (request_type_id, request_type) VALUES ('offshore-delivery', 'Offshore Delivery');
GO
