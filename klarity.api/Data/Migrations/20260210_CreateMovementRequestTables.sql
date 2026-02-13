-- Create logistics schema if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'logistics')
BEGIN
    EXEC('CREATE SCHEMA logistics');
END
GO

-- Create movement_requests table
IF OBJECT_ID('logistics.movement_requests', 'U') IS NOT NULL
    DROP TABLE logistics.movement_requests;
GO

CREATE TABLE marine.movement_requests(
    request_id VARCHAR(50) PRIMARY KEY,
    request_date DATETIME2 DEFAULT GETDATE(),
    status VARCHAR(50) NOT NULL, -- Draft, Pending, Approved, Rejected, etc.
    schedule_indicator VARCHAR(50) NOT NULL, -- Scheduled, Unscheduled
    origin NVARCHAR(255) NOT NULL,
    destination NVARCHAR(255) NOT NULL,
    earliest_departure DATETIME2 NOT NULL,
    latest_departure DATETIME2,
    earliest_arrival DATETIME2,
    latest_arrival DATETIME2 NOT NULL,
    requested_by VARCHAR(50),
    urgency_id VARCHAR(50) NOT NULL,
    is_hazardous BIT NOT NULL DEFAULT 0,
    request_type_id VARCHAR(50),
    transportation_required BIT DEFAULT 1,
    lifting NVARCHAR(100),
    business_unit NVARCHAR(255),
    cost_centre NVARCHAR(255),
    comments NVARCHAR(MAX),
    notify NVARCHAR(MAX) -- Comma-separated or JSON array of emails
);
GO

-- Create movement_request_items table
IF OBJECT_ID('logistics.movement_request_items', 'U') IS NOT NULL
    DROP TABLE logistics.movement_request_items;
GO

CREATE TABLE marine.movement_request_items (
    item_id VARCHAR(50) PRIMARY KEY,
    request_id VARCHAR(50) NOT NULL REFERENCES logistics.movement_requests(request_id) ON DELETE CASCADE,
    consignment_type_id VARCHAR(50) NOT NULL,
    item_type_id VARCHAR(50) NOT NULL,
    quantity FLOAT NOT NULL,
    unit_of_measurement NVARCHAR(50) NOT NULL,
    description NVARCHAR(MAX),
    dimensions NVARCHAR(255),
    dimension_unit VARCHAR(10),
    volume FLOAT,
    weight FLOAT,
    weight_unit VARCHAR(10),
    assigned_voyage_id VARCHAR(50),
    status VARCHAR(50),
    is_hazardous BIT NOT NULL DEFAULT 0
);
GO

-- Insert Mock Data from logisticsData.ts
INSERT INTO marine.movement_requests(
    request_id, request_date, status, schedule_indicator, origin, destination, 
    earliest_departure, latest_departure, earliest_arrival, latest_arrival, 
    urgency_id, is_hazardous, requested_by
) VALUES 
('MR-2024-001', '2026-02-10T10:00:00', 'Approved', 'Scheduled', 'Bonga', 'Ladol', 
 '2026-02-07T08:00:00', '2026-02-07T18:00:00', '2026-02-08T08:00:00', '2026-02-08T18:00:00', 
 'routine-operations', 0, 'bobby.ekpo'),
('MR-2024-002', '2026-02-10T10:05:00', 'Approved', 'Scheduled', 'Onne', 'Ladol', 
 '2024-03-14T06:00:00', '2024-03-15T12:00:00', '2024-03-15T06:00:00', '2024-03-16T12:00:00', 
 'routine-operations', 0, 'bobby.ekpo'),
('MR-2024-004', '2026-02-10T10:10:00', 'Pending', 'Unscheduled', 'Onne', 'Tincan', 
 '2026-03-07T06:00:00', NULL, NULL, '2026-03-28T16:00:00', 
 'urgent-operations', 1, 'bobby.ekpo');

INSERT INTO marine.movement_request_items (
    item_id, request_id, consignment_type_id, item_type_id, quantity, unit_of_measurement, 
    description, dimensions, weight, assigned_voyage_id, status, is_hazardous
) VALUES 
('ITM-001', 'MR-2024-001', 'cargo', 'drill-pipes', 50, 'tonnes', 'Standard drill pipes', '12.0 x 0.5 x 0.5', 2.5, 'v1-voy1', 'Approved', 0),
('ITM-001-B', 'MR-2024-001', 'cargo', 'containers', 2, 'units', '20ft containers', '6.1 x 2.4 x 2.6', 4.0, 'v1-voy1', 'Approved', 0),
('ITM-002', 'MR-2024-002', 'personnel', 'crew-change', 12, 'pax', 'Regular crew rotation', '0 x 0 x 0', 0.8, 'v3-voy1', 'Approved', 0),
('ITM-U-001', 'MR-2024-004', 'hazardous', 'chemicals', 50, 'barrels', 'Hazardous Chemicals', '12m x 6m', 12.5, NULL, 'Pending', 1);
