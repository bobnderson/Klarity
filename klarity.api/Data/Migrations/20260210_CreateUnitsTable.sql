-- Create logistics.units_of_measurement table
IF OBJECT_ID('logistics.units_of_measurement', 'U') IS NOT NULL
    DROP TABLE logistics.units_of_measurement;
GO

CREATE TABLE logistics.units_of_measurement (
    unit_id VARCHAR(50) PRIMARY KEY,
    unit_label NVARCHAR(100) NOT NULL,
    display_order INT NOT NULL
);
GO

-- Insert mock data
INSERT INTO logistics.units_of_measurement (unit_id, unit_label, display_order)
VALUES 
('barrels', 'barrels', 1),
('boxes', 'boxes', 2),
('ft2', 'ft2', 3),
('gal', 'gal', 4),
('kg', 'kg', 5),
('lbs', 'lbs', 6),
('liters', 'liters', 7),
('m2', 'm2', 8),
('m3', 'm3', 9),
('MT', 'MT', 10),
('pallets', 'pallets', 11),
('pax', 'pax', 12),
('tonnes', 'tonnes', 13),
('units', 'units', 14);
GO
