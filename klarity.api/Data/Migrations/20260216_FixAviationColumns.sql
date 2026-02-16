-- Rename columns in aviation.flight_schedules
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[aviation].[flight_schedules]') AND name = 'vessel_id')
BEGIN
    EXEC sp_rename '[aviation].[flight_schedules].[vessel_id]', 'helicopter_id', 'COLUMN';
END;

-- Rename columns in aviation.flights
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[aviation].[flights]') AND name = 'vessel_id')
BEGIN
    EXEC sp_rename '[aviation].[flights].[vessel_id]', 'helicopter_id', 'COLUMN';
END;

-- Rename columns in aviation.flight_stops
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[aviation].[flight_stops]') AND name = 'vessel_id')
BEGIN
    EXEC sp_rename '[aviation].[flight_stops].[vessel_id]', 'helicopter_id', 'COLUMN';
END;

-- Fix movement_request_items column if it was incorrect
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[aviation].[movement_request_items]') AND name = 'assigned_voyage_id')
BEGIN
    EXEC sp_rename '[aviation].[movement_request_items].[assigned_voyage_id]', 'assigned_flight_id', 'COLUMN';
END;
GO
