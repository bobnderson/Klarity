-- Create marine schema if it doesn't exist (should already exist from previous migrations)
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'marine')
BEGIN
    EXEC('CREATE SCHEMA marine');
END
GO

-- Create locations table
IF OBJECT_ID('marine.locations', 'U') IS NOT NULL
    DROP TABLE marine.locations;
GO

CREATE TABLE marine.locations (
    location_id VARCHAR(50) PRIMARY KEY,
    location_name NVARCHAR(255) NOT NULL,
    location_type NVARCHAR(50) NOT NULL, -- Platform or Port
    latitude FLOAT,
    longitude FLOAT
);
GO

-- Insert Mock Locations
INSERT INTO marine.locations (location_id, location_name, location_type, latitude, longitude) VALUES 
('loc-001', 'Onne Port', 'Port', 4.7077, 7.1517),
('loc-002', 'Lagos Port', 'Port', 6.4383, 3.3644),
('loc-003', 'Bonga Field Platform', 'Platform', 4.5500, 4.6167),
('loc-004', 'Amenam Platform', 'Platform', 4.0833, 7.4167),
('loc-005', 'Egina FPSO', 'Platform', 3.4167, 6.7500),
('loc-006', 'Port Harcourt Port', 'Port', 4.7500, 7.0000);
GO
