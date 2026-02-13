-- Create marine schema if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'marine')
BEGIN
    EXEC('CREATE SCHEMA marine');
END
GO

-- Create vessel_statuses table
IF OBJECT_ID('marine.vessel_statuses', 'U') IS NOT NULL
    DROP TABLE marine.vessel_statuses;
GO

CREATE TABLE marine.vessel_statuses (
    status_id VARCHAR(50) PRIMARY KEY,
    status_name NVARCHAR(255) NOT NULL
);
GO

-- Insert Vessel Statuses
INSERT INTO marine.vessel_statuses (status_id, status_name) VALUES 
('repair', 'Undergoing repairs'),
('dry_dock', 'In dry dock'),
('inspection', 'Undergoing inspection/survey'),
('maintenance', 'Routine maintenance'),
('failure', 'Mechanical failure'),
('rotation', 'Crew rotation in progress'),
('fueling', 'Taking fuel'),
('supplies', 'Taking stores/supplies'),
('active', 'Active'),
('inactive', 'Inactive');

-- Create vessel_categories table
IF OBJECT_ID('marine.vessel_categories', 'U') IS NOT NULL
    DROP TABLE marine.vessel_categories;
GO

CREATE TABLE marine.vessel_categories (
    category_id VARCHAR(50) PRIMARY KEY,
    category_name NVARCHAR(255) NOT NULL
);
GO

-- Create vessel_category_types table
IF OBJECT_ID('marine.vessel_category_types', 'U') IS NOT NULL
    DROP TABLE marine.vessel_category_types;
GO

CREATE TABLE marine.vessel_category_types (
    category_type_id VARCHAR(50) PRIMARY KEY,
    category_id VARCHAR(50) NOT NULL REFERENCES marine.vessel_categories(category_id),
    type_name NVARCHAR(255) NOT NULL
);
GO

-- Create vessels table
IF OBJECT_ID('marine.vessels', 'U') IS NOT NULL
    DROP TABLE marine.vessels;
GO

CREATE TABLE marine.vessels (
    vessel_id VARCHAR(50) PRIMARY KEY,
    vessel_name NVARCHAR(255) NOT NULL,
    owner NVARCHAR(255),
    vessel_type_id NVARCHAR(100),
    vessel_category_id NVARCHAR(255),
    status_id NVARCHAR(50),
    
    -- Particulars
    loa FLOAT,
    lwl FLOAT,
    breadth_moulded FLOAT,
    depth_main_deck FLOAT,
    design_draft FLOAT,
    
    -- Capacities
    fuel_oil FLOAT,
    potable_water FLOAT,
    drill_water FLOAT,
    liquid_mud FLOAT,
    dry_bulk_mud FLOAT,
    dead_weight FLOAT,
    deck_area FLOAT,
    deck_loading FLOAT,
    
    -- Performance
    service_speed FLOAT,
    max_speed FLOAT,

    -- Financials
    hourly_operating_cost FLOAT,
    fuel_consumption_rate FLOAT,
    mobilisation_cost FLOAT,

    -- Capacity
    total_complement INT
);
GO

-- Insert Mock Categories
INSERT INTO marine.vessel_categories (category_id, category_name) VALUES 
('cat_drilling', 'Offshore Drilling & Exploration Vessel'),
('cat_support', 'Offshore Support Vessels'),
('cat_tankers', 'Transport Tankers');

-- Insert Mock Category Types
INSERT INTO marine.vessel_category_types (category_type_id, category_id, type_name) VALUES 
('type_drillship', 'cat_drilling', 'Drillship'),
('type_jackup', 'cat_drilling', 'Jack-up Rig'),
('type_semisub', 'cat_drilling', 'Semi-submersible'),
('type_psv', 'cat_support', 'PSV (Platform Supply Vessel)'),
('type_ahts', 'cat_support', 'AHTS (Anchor Handling Tug Supply)'),
('type_msv', 'cat_support', 'MSV (Multipurpose Support Vessel)'),
('type_fsv', 'cat_support', 'Fast Supply Intervention'),
('type_oil', 'cat_tankers', 'Oil Tanker'),
('type_lng', 'cat_tankers', 'LNG Carrier'),
('type_chem', 'cat_tankers', 'Chemical Tanker');

-- Insert Mock Vessels
INSERT INTO marine.vessels (vessel_id, vessel_name, owner, vessel_type_id, vessel_category_id, status_id, loa, lwl, breadth_moulded, depth_main_deck, design_draft, fuel_oil, potable_water, drill_water, liquid_mud, dry_bulk_mud, dead_weight, deck_area, deck_loading, service_speed, max_speed, hourly_operating_cost, fuel_consumption_rate, mobilisation_cost, total_complement) VALUES 
('v1', 'MV Atlas', 'Vard Marine', 'type_psv', 'cat_support', 'active', 85, 82, 18, 7, 5.5, 800, 500, 1200, 600, 400, 4500, 900, 5, 12, 14.5, 500, 100, 5000, 25),
('v2', 'MV Horizon', 'Seacor', 'type_ahts', 'cat_support', 'maintenance', 75, 72, 16, 6.5, 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 11, 13, 800, 150, 7500, 18),
('v3', 'MV Enterprise', 'Maersk', 'type_drillship', 'cat_drilling', 'active', 230, 220, 42, 19, 12, 4500, 1200, 2500, 1800, 900, 60000, 2500, 15, 10, 12, 1200, 200, 12000, 120),
('v4', 'MV Voyager', 'Seadrill', 'type_semisub', 'cat_drilling', 'inactive', 110, 95, 75, 35, 22, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 6, 8, 1500, 250, 15000, 95),
('v5', 'MV Discovery', 'TechnipFMC', 'type_msv', 'cat_support', 'active', 130, 122, 24, 11, 7.5, 1500, 800, 0, 0, 0, 8000, 1200, 10, 13, 15, 900, 180, 8000, 45);
