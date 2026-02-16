-- Migration to add technical specifications to aviation.helicopters
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('aviation.helicopters') AND name = 'cruise_airspeed_kts')
BEGIN
    ALTER TABLE aviation.helicopters ADD 
        cruise_airspeed_kts DECIMAL(10, 2),
        basic_operating_weight_lb FLOAT,
        max_gross_weight_lb FLOAT,
        available_payload_lb FLOAT,
        max_fuel_gal FLOAT,
        max_fuel_lb FLOAT,
        endurance_hours FLOAT,
        range_nm FLOAT,
        passenger_seats INT;
END
GO
