-- Create Item Reference Tables
-- Migration: 20260213_CreateItemReferenceTables.sql

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'logistics')
BEGIN
    EXEC('CREATE SCHEMA logistics');
END
GO

-- 1. Create item_categories table
IF OBJECT_ID('logistics.item_types', 'U') IS NOT NULL
    DROP TABLE logistics.item_types;
GO

IF OBJECT_ID('logistics.item_categories', 'U') IS NOT NULL
    DROP TABLE logistics.item_categories;
GO

CREATE TABLE logistics.item_categories (
    category_id VARCHAR(50) PRIMARY KEY,
    category_name NVARCHAR(100) NOT NULL
);
GO

-- 2. Create item_types table
CREATE TABLE logistics.item_types (
    type_id VARCHAR(50) PRIMARY KEY,
    category_id VARCHAR(50) NOT NULL REFERENCES logistics.item_categories(category_id),
    type_name NVARCHAR(100) NOT NULL
);
GO

-- 3. Seed item_categories
INSERT INTO logistics.item_categories (category_id, category_name) VALUES
('cargo', 'Cargo'),
('personnel', 'Personnel');
GO

-- 4. Seed item_types
INSERT INTO logistics.item_types (type_id, category_id, type_name) VALUES
-- Cargo types
('gen-cargo', 'cargo', 'General Cargo'),
('containers', 'cargo', 'Containers'),
('drill-pipes', 'cargo', 'Drill Pipes'),
('casing', 'cargo', 'Casing'),
('provisions', 'cargo', 'Food/Provisions'),
('chemicals', 'cargo', 'Chemicals'),
('fuel', 'cargo', 'Fuel/Lube'),
('waste', 'cargo', 'Waste/Slop'),

-- Personnel types
('crew-change', 'personnel', 'Crew Change'),
('technicians', 'personnel', 'Technicians'),
('visitors', 'personnel', 'Visitors'),
('medevac', 'personnel', 'Medical Evacuation');
GO

-- 5. Update marine.movement_request_items table
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'movement_request_items' AND schema_id = SCHEMA_ID('marine'))
BEGIN
    PRINT 'Updating marine.movement_request_items column name...';
    
    -- Rename consignment_type_id to category_id
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('marine.movement_request_items') AND name = 'consignment_type_id')
    BEGIN
        EXEC sp_rename 'marine.movement_request_items.consignment_type_id', 'category_id', 'COLUMN';
    END
END
GO
