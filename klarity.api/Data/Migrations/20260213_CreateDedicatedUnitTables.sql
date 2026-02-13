-- Create Dedicated Unit Tables in master schema
-- Migration: 20260213_CreateDedicatedUnitTables.sql

-- 1. Create dimension_units table
IF OBJECT_ID('master.dimension_units', 'U') IS NOT NULL
    DROP TABLE master.dimension_units;
GO

CREATE TABLE master.dimension_units (
    unit_id VARCHAR(50) PRIMARY KEY,
    unit_label NVARCHAR(100) NOT NULL
);
GO

-- 2. Create weight_units table
IF OBJECT_ID('master.weight_units', 'U') IS NOT NULL
    DROP TABLE master.weight_units;
GO

CREATE TABLE master.weight_units (
    unit_id VARCHAR(50) PRIMARY KEY,
    unit_label NVARCHAR(100) NOT NULL
);
GO

-- 3. Seed dimension_units
INSERT INTO master.dimension_units (unit_id, unit_label) VALUES
('ft', 'ft'),
('m3', 'm3'),
('ft3', 'ft3'),
('cm3', 'cm3'),
('in3', 'in3');
GO

-- 4. Seed weight_units
INSERT INTO master.weight_units (unit_id, unit_label) VALUES
('kg', 'kg'),
('lbs', 'lbs'),
('tonnes', 'tonnes'),
('MT', 'MT');
GO
