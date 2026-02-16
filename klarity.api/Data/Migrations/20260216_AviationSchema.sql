-- Migration script for Decoupled Aviation Schema
-- 1. Create aviation schema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'aviation')
BEGIN
    EXEC('CREATE SCHEMA aviation');
END
GO

-- 2. Create aviation.helicopters (Separate from marine.vessels)
IF OBJECT_ID('aviation.helicopters', 'U') IS NULL
BEGIN
    CREATE TABLE aviation.helicopters (
        vessel_id VARCHAR(50) PRIMARY KEY, -- Reusing vessel_id as primary key name for compatibility
        vessel_name NVARCHAR(255) NOT NULL,
        vessel_type_id VARCHAR(50),
        status_id VARCHAR(50),
        pax_capacity INT,
        is_deleted BIT DEFAULT 0,
        metadata NVARCHAR(MAX) -- For any additional specific helicopter data
    );

    -- Migrate existing helicopter data from marine vessels
    INSERT INTO aviation.helicopters (vessel_id, vessel_name, vessel_type_id, status_id, pax_capacity)
    SELECT v.vessel_id, v.vessel_name, v.vessel_type_id, v.status_id, 12 -- Default capacity
    FROM marine.vessels v
    WHERE v.vessel_type_id IN (SELECT category_type_id FROM marine.vessel_category_types WHERE type_name = 'Helicopter');
END
GO

-- 3. Create aviation.flights (Separate from marine.voyages)
IF OBJECT_ID('aviation.flights', 'U') IS NULL
BEGIN
    CREATE TABLE aviation.flights (
        flight_id VARCHAR(50) PRIMARY KEY,
        vessel_id VARCHAR(50) REFERENCES aviation.helicopters(vessel_id),
        origin_id VARCHAR(50),
        destination_id VARCHAR(50),
        departure_date_time DATETIME2,
        eta DATETIME2,
        cost_per_pax DECIMAL(18, 2),
        pax_capacity INT,
        pax_current INT DEFAULT 0,
        status_id VARCHAR(50),
        is_deleted BIT DEFAULT 0
    );

    -- Sub-tables for flights (stops, etc.) if needed
    CREATE TABLE aviation.flight_stops (
        stop_id INT IDENTITY(1,1) PRIMARY KEY,
        flight_id VARCHAR(50) REFERENCES aviation.flights(flight_id) ON DELETE CASCADE,
        location_id VARCHAR(50),
        arrival_time DATETIME2,
        departure_time DATETIME2,
        stop_order INT
    );
END
GO

-- 4. Create aviation.movement_requests (Separate from marine.movement_requests)
IF OBJECT_ID('aviation.movement_requests', 'U') IS NULL
BEGIN
    CREATE TABLE aviation.movement_requests (
        request_id VARCHAR(50) PRIMARY KEY,
        request_date DATETIME2 DEFAULT GETDATE(),
        status VARCHAR(50) NOT NULL,
        origin_id VARCHAR(50),
        destination_id VARCHAR(50),
        earliest_departure DATETIME2 NOT NULL,
        latest_arrival DATETIME2 NOT NULL,
        requested_by VARCHAR(50),
        urgency_id VARCHAR(50),
        business_unit_id NVARCHAR(50),
        cost_centre NVARCHAR(255),
        comments NVARCHAR(MAX),
        
        -- Aviation Specific Fields
        trip_type NVARCHAR(20),
        selected_flight_id VARCHAR(50),
        return_flight_id VARCHAR(50),
        approver_id NVARCHAR(100),
        approved_at DATETIME NULL,
        approver_comments NVARCHAR(MAX),
        
        is_deleted BIT DEFAULT 0
    );

    CREATE TABLE aviation.movement_request_items (
        item_id VARCHAR(50) PRIMARY KEY,
        request_id VARCHAR(50) NOT NULL REFERENCES aviation.movement_requests(request_id) ON DELETE CASCADE,
        item_type_id VARCHAR(50),
        quantity FLOAT NOT NULL,
        description NVARCHAR(MAX),
        weight FLOAT,
        assigned_flight_id VARCHAR(50) REFERENCES aviation.flights(flight_id),
        is_hazardous BIT DEFAULT 0
    );
END
GO
