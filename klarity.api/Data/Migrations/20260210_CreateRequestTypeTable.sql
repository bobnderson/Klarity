-- Create logistics.request_types table
IF OBJECT_ID('logistics.request_types', 'U') IS NOT NULL
    DROP TABLE logistics.request_types;
GO

CREATE TABLE logistics.request_types (
    request_type_id VARCHAR(50) PRIMARY KEY,
    request_type NVARCHAR(100) NOT NULL
);
GO

-- Insert mock data
INSERT INTO logistics.request_types (request_type_id, request_type)
VALUES 
('req-001', 'Offshore Delivery'),
('req-002', 'Backhaul'),
('req-003', 'In Field Transfer'),
('req-004', 'Vendor to Vendor');
GO
