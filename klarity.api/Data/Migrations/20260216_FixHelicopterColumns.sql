-- Migration to fix missing columns in aviation.helicopters
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[aviation].[helicopters]') AND name = 'cruise_airspeed_kts')
BEGIN
    ALTER TABLE aviation.helicopters ADD cruise_airspeed_kts DECIMAL(10, 2);
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[aviation].[helicopters]') AND name = 'owner')
BEGIN
    ALTER TABLE aviation.helicopters ADD owner NVARCHAR(255);
END;
