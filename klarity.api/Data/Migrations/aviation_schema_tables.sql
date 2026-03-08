-- DROP SCHEMA aviation;

CREATE SCHEMA aviation;
-- klarity.aviation.helicopters definition

-- Drop table

-- DROP TABLE klarity.aviation.helicopters;

CREATE TABLE klarity.aviation.helicopters ( helicopter_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, helicopter_name nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, helicopter_type_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, status_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, is_deleted bit DEFAULT 0 NULL, owner nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, basic_operating_weight_lb float NULL, max_gross_weight_lb float NULL, available_payload_lb float NULL, max_fuel_gal float NULL, max_fuel_lb float NULL, endurance_hours float NULL, range_nm float NULL, passenger_seats int NULL, cruise_airspeed_kts decimal(10,2) NULL, CONSTRAINT PK__helicopt__A35228632EBD856B PRIMARY KEY (helicopter_id));


-- klarity.aviation.movement_requests definition

-- Drop table

-- DROP TABLE klarity.aviation.movement_requests;

CREATE TABLE klarity.aviation.movement_requests ( request_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, request_date datetime2 DEFAULT getdate() NULL, status varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, origin_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, destination_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, earliest_departure datetime2 NOT NULL, latest_arrival datetime2 NOT NULL, requested_by varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, urgency_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, business_unit_id nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, cost_centre nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, comments nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, trip_type nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, departure_flight_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, return_flight_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, approver_id nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, approved_at datetime NULL, approver_comments nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, is_deleted bit DEFAULT 0 NULL, selected_flight_id nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, CONSTRAINT PK__movement__18D3B90F79F1FE4E PRIMARY KEY (request_id));


-- klarity.aviation.request_types definition

-- Drop table

-- DROP TABLE klarity.aviation.request_types;

CREATE TABLE klarity.aviation.request_types ( request_type_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, request_type nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, CONSTRAINT PK__request___C24DD950C73E898E PRIMARY KEY (request_type_id));


-- klarity.aviation.flight_schedules definition

-- Drop table

-- DROP TABLE klarity.aviation.flight_schedules;

CREATE TABLE klarity.aviation.flight_schedules ( schedule_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, helicopter_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, origin_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, destination_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, departure_time time NOT NULL, duration_minutes int NOT NULL, frequency nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, days_of_week nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, day_of_month int NULL, is_active bit DEFAULT 1 NULL, created_at datetime2 DEFAULT getdate() NULL, updated_at datetime2 DEFAULT getdate() NULL, CONSTRAINT PK__flight_s__C46A8A6FD0A6CEE9 PRIMARY KEY (schedule_id), CONSTRAINT FK__flight_sc__vesse__68D28DBC FOREIGN KEY (helicopter_id) REFERENCES klarity.aviation.helicopters(helicopter_id));
CREATE NONCLUSTERED INDEX IX_FlightSchedules_Route ON klarity.aviation.flight_schedules (origin_id, destination_id);


-- klarity.aviation.flights definition

-- Drop table

-- DROP TABLE klarity.aviation.flights;

CREATE TABLE klarity.aviation.flights ( flight_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, schedule_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, pax_count int DEFAULT 0 NULL, status_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, is_deleted bit DEFAULT 0 NULL, actual_depart datetime NULL, actual_arrive datetime NULL, created_at datetime2(0) DEFAULT getdate() NULL, plan_depart datetime NULL, plan_arrive datetime NULL, CONSTRAINT PK__flights__E37057652AB88D04 PRIMARY KEY (flight_id), CONSTRAINT flights_flight_schedules_FK FOREIGN KEY (schedule_id) REFERENCES klarity.aviation.flight_schedules(schedule_id));


-- klarity.aviation.movement_request_items definition

-- Drop table

-- DROP TABLE klarity.aviation.movement_request_items;

CREATE TABLE klarity.aviation.movement_request_items ( item_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, request_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, item_type_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, quantity float NOT NULL, description nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, weight float NULL, assigned_flight_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, is_hazardous bit DEFAULT 0 NULL, status varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT 'Approved' NULL, CONSTRAINT PK__movement__52020FDD39FFD0A4 PRIMARY KEY (item_id), CONSTRAINT FK__movement___assig__3DE82FB7 FOREIGN KEY (assigned_flight_id) REFERENCES klarity.aviation.flights(flight_id), CONSTRAINT FK__movement___reque__3CF40B7E FOREIGN KEY (request_id) REFERENCES klarity.aviation.movement_requests(request_id) ON DELETE CASCADE);


-- klarity.aviation.flight_stops definition

-- Drop table

-- DROP TABLE klarity.aviation.flight_stops;

CREATE TABLE klarity.aviation.flight_stops ( stop_id int IDENTITY(1,1) NOT NULL, flight_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, location_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, arrival_time datetime2 NULL, departure_time datetime2 NULL, stop_order int NULL, CONSTRAINT PK__flight_s__86FBE1828876075B PRIMARY KEY (stop_id), CONSTRAINT FK__flight_st__fligh__36470DEF FOREIGN KEY (flight_id) REFERENCES klarity.aviation.flights(flight_id) ON DELETE CASCADE);