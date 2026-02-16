-- Migration script for Flight Scheduling System
-- Create aviation.flight_schedules table

IF OBJECT_ID('aviation.flight_schedules', 'U') IS NULL
BEGIN
    CREATE TABLE aviation.flight_schedules (
        schedule_id VARCHAR(50) PRIMARY KEY,
        vessel_id VARCHAR(50) REFERENCES aviation.helicopters(vessel_id),
        origin_id VARCHAR(50),
        destination_id VARCHAR(50),
        departure_time TIME NOT NULL,
        duration_minutes INT NOT NULL,
        frequency NVARCHAR(20) NOT NULL, -- 'Daily', 'Weekly', 'Monthly'
        days_of_week NVARCHAR(50),      -- Comma-separated: 'Mon,Wed,Fri'
        day_of_month INT,               -- 1-31
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );

    -- Create index for faster lookups
    CREATE INDEX IX_FlightSchedules_Route ON aviation.flight_schedules (origin_id, destination_id);
END
GO
