-- Move Locations table from marine to logistics schema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'logistics')
BEGIN
    EXEC('CREATE SCHEMA logistics');
END
GO

IF OBJECT_ID('marine.locations', 'U') IS NOT NULL AND OBJECT_ID('logistics.locations', 'U') IS NULL
BEGIN
    PRINT 'Transferring marine.locations to logistics schema...';
    ALTER SCHEMA logistics TRANSFER marine.locations;
END
ELSE IF OBJECT_ID('marine.locations', 'U') IS NOT NULL AND OBJECT_ID('logistics.locations', 'U') IS NOT NULL
BEGIN
    PRINT 'Both marine.locations and logistics.locations exist. Merging data and removing old table...';
    INSERT INTO logistics.locations (location_id, location_name, location_type, latitude, longitude)
    SELECT m.location_id, m.location_name, m.location_type, m.latitude, m.longitude
    FROM marine.locations m
    WHERE NOT EXISTS (SELECT 1 FROM logistics.locations l WHERE l.location_id = m.location_id);
    
    DROP TABLE marine.locations;
END
GO
