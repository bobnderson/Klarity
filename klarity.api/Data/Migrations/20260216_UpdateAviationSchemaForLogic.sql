
-- Update aviation.flights schema
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('aviation.flights') AND name = 'schedule_id')
BEGIN
    ALTER TABLE aviation.flights ADD schedule_id VARCHAR(50);
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('aviation.flights') AND name = 'plan_depart')
BEGIN
    ALTER TABLE aviation.flights ADD plan_depart DATETIME2;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('aviation.flights') AND name = 'plan_arrive')
BEGIN
    ALTER TABLE aviation.flights ADD plan_arrive DATETIME2;
END

-- Ensure pax_current is aligned or treated as pax_count
-- The user used 'pax_count' in INSERT, checking if we need to rename or just map in code.
-- Existing schema has 'pax_current'. We will stick with 'pax_current' in table but map user's 'pax_count' to it in repository.

-- Update aviation.movement_requests schema
-- User requested 'departure_flight_id', migration had 'selected_flight_id'.
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('aviation.movement_requests') AND name = 'selected_flight_id')
BEGIN
    EXEC sp_rename 'aviation.movement_requests.selected_flight_id', 'departure_flight_id', 'COLUMN';
END
