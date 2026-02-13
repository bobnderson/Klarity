-- Create master schema if not exists
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'master')
BEGIN
    EXEC('CREATE SCHEMA [master]')
END
GO

-- Create master.business_units table
IF OBJECT_ID('master.cost_centres', 'U') IS NOT NULL
    DROP TABLE master.cost_centres;
GO

IF OBJECT_ID('master.business_units', 'U') IS NOT NULL
    DROP TABLE master.business_units;
GO

CREATE TABLE master.business_units (
    unit_id VARCHAR(50) PRIMARY KEY,
    unit_name NVARCHAR(100) NOT NULL
);
GO

CREATE TABLE master.cost_centres (
    cost_centre_id INT IDENTITY(1,1) PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    unit_id VARCHAR(50) NOT NULL REFERENCES master.business_units(unit_id) ON DELETE CASCADE
);
GO

-- Insert mock data Business Units
INSERT INTO master.business_units (unit_id, unit_name) VALUES 
('bu-001', 'Upstream Nigeria'),
('bu-002', 'Deepwater Operations'),
('bu-003', 'Logistics Services');
GO

-- Insert mock data Cost Centres
-- Upstream Nigeria
INSERT INTO master.cost_centres (code, name, unit_id) VALUES 
('CC-101', 'Exploration - 101', 'bu-001'),
('CC-102', 'Production - 102', 'bu-001');

-- Deepwater Operations
INSERT INTO master.cost_centres (code, name, unit_id) VALUES 
('CC-201', 'Bonga Operations - 201', 'bu-002'),
('CC-202', 'Maintenance - 202', 'bu-002');

-- Logistics Services
INSERT INTO master.cost_centres (code, name, unit_id) VALUES 
('CC-301', 'Marine Logistics - 301', 'bu-003'),
('CC-302', 'Aviation - 302', 'bu-003');
GO
