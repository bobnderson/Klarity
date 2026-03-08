-- DROP SCHEMA marine;

CREATE SCHEMA marine;
-- klarity.marine.movement_requests definition

-- Drop table

-- DROP TABLE klarity.marine.movement_requests;

CREATE TABLE klarity.marine.movement_requests ( request_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, request_date datetime2 DEFAULT getdate() NULL, status varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, schedule_indicator varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, origin_id nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, destination_id nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, earliest_departure datetime2 NOT NULL, latest_departure datetime2 NULL, earliest_arrival datetime2 NULL, latest_arrival datetime2 NOT NULL, requested_by varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, urgency_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, is_hazardous bit DEFAULT 0 NOT NULL, request_type_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, transportation_required bit DEFAULT 1 NULL, lifting nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, business_unit_id nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, cost_centre nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, comments nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, notify nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, is_deleted bit DEFAULT 0 NOT NULL, trip_type nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, selected_voyage_id nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, return_voyage_id nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, approver_id nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, approved_at datetime NULL, approver_comments nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, CONSTRAINT PK__movement__18D3B90F3213D7A4 PRIMARY KEY (request_id));


-- klarity.marine.vessel_categories definition

-- Drop table

-- DROP TABLE klarity.marine.vessel_categories;

CREATE TABLE klarity.marine.vessel_categories ( category_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, category_name nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, CONSTRAINT PK__vessel_c__D54EE9B4F369CC52 PRIMARY KEY (category_id));


-- klarity.marine.vessel_statuses definition

-- Drop table

-- DROP TABLE klarity.marine.vessel_statuses;

CREATE TABLE klarity.marine.vessel_statuses ( status_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, status_name nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, CONSTRAINT PK__vessel_s__3683B531B7D63A11 PRIMARY KEY (status_id));


-- klarity.marine.vessels definition

-- Drop table

-- DROP TABLE klarity.marine.vessels;

CREATE TABLE klarity.marine.vessels ( vessel_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, vessel_name nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, owner nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, vessel_type_id nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, vessel_category_id nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, status_id nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, loa float NULL, lwl float NULL, breadth_moulded float NULL, depth_main_deck float NULL, design_draft float NULL, fuel_oil float NULL, potable_water float NULL, drill_water float NULL, liquid_mud float NULL, dry_bulk_mud float NULL, dead_weight float NULL, deck_area float NULL, deck_loading float NULL, service_speed float NULL, max_speed float NULL, hourly_operating_cost float NULL, fuel_consumption_rate float NULL, mobilisation_cost float NULL, total_complement int NULL, CONSTRAINT PK__vessels__A352286390E4DF4B PRIMARY KEY (vessel_id));


-- klarity.marine.voyage_statuses definition

-- Drop table

-- DROP TABLE klarity.marine.voyage_statuses;

CREATE TABLE klarity.marine.voyage_statuses ( status_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, status nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, CONSTRAINT PK__voyage_s__3683B5313389AFE3 PRIMARY KEY (status_id));


-- klarity.marine.movement_request_items definition

-- Drop table

-- DROP TABLE klarity.marine.movement_request_items;

CREATE TABLE klarity.marine.movement_request_items ( item_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, request_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, category_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, item_type_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, quantity float NOT NULL, unit_of_measurement nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, description nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, dimensions nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, dimension_unit varchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, volume float NULL, weight float NULL, weight_unit varchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, assigned_voyage_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, status varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, is_hazardous bit DEFAULT 0 NOT NULL, CONSTRAINT PK__movement__52020FDD4182C771 PRIMARY KEY (item_id), CONSTRAINT FK__movement___reque__42E1EEFE FOREIGN KEY (request_id) REFERENCES klarity.marine.movement_requests(request_id) ON DELETE CASCADE);


-- klarity.marine.vessel_category_types definition

-- Drop table

-- DROP TABLE klarity.marine.vessel_category_types;

CREATE TABLE klarity.marine.vessel_category_types ( category_type_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, category_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, type_name nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, CONSTRAINT PK__vessel_c__08599B29E513C74A PRIMARY KEY (category_type_id), CONSTRAINT FK__vessel_ca__categ__6FDF7DFE FOREIGN KEY (category_id) REFERENCES klarity.marine.vessel_categories(category_id));


-- klarity.marine.voyage_schedules definition

-- Drop table

-- DROP TABLE klarity.marine.voyage_schedules;

CREATE TABLE klarity.marine.voyage_schedules ( schedule_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, vessel_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, origin_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, destination_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, departure_time time NOT NULL, duration_days int NOT NULL, frequency nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, days_of_week nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, day_of_month int NULL, is_active bit DEFAULT 1 NULL, created_at datetime2 DEFAULT getdate() NULL, updated_at datetime2 DEFAULT getdate() NULL, CONSTRAINT PK__voyage_s__C46A8A6FEA4DA57A PRIMARY KEY (schedule_id));
CREATE NONCLUSTERED INDEX IX_VoyageSchedules_Route ON klarity.marine.voyage_schedules (origin_id, destination_id);


-- klarity.marine.voyage_stops definition

-- Drop table

-- DROP TABLE klarity.marine.voyage_stops;

CREATE TABLE klarity.marine.voyage_stops ( stop_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, voyage_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, location_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, arrival_date_time datetime2 NOT NULL, departure_date_time datetime2 NOT NULL, status_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT 'scheduled' NULL, CONSTRAINT PK__voyage_s__86FBE18253E27A67 PRIMARY KEY (stop_id));


-- klarity.marine.voyages definition

-- Drop table

-- DROP TABLE klarity.marine.voyages;

CREATE TABLE klarity.marine.voyages ( voyage_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, vessel_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, origin_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, destination_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, departure_date_time datetime2 NOT NULL, eta datetime2 NOT NULL, weight_util float DEFAULT 0 NOT NULL, deck_util float DEFAULT 0 NOT NULL, cabin_util float DEFAULT 0 NOT NULL, status_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT 'scheduled' NULL, is_deleted bit DEFAULT 0 NOT NULL, cost_per_pax decimal(18,2) NULL, pax_capacity int NULL, pax_current int NULL, schedule_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, CONSTRAINT PK__voyages__A2EBD4149BDB9129 PRIMARY KEY (voyage_id));


-- klarity.marine.voyage_schedules foreign keys

ALTER TABLE klarity.marine.voyage_schedules ADD CONSTRAINT FK__voyage_sc__desti__05CEBF1D FOREIGN KEY (destination_id) REFERENCES klarity.logistics.locations(location_id);
ALTER TABLE klarity.marine.voyage_schedules ADD CONSTRAINT FK__voyage_sc__origi__04DA9AE4 FOREIGN KEY (origin_id) REFERENCES klarity.logistics.locations(location_id);
ALTER TABLE klarity.marine.voyage_schedules ADD CONSTRAINT FK__voyage_sc__vesse__03E676AB FOREIGN KEY (vessel_id) REFERENCES klarity.marine.vessels(vessel_id);


-- klarity.marine.voyage_stops foreign keys

ALTER TABLE klarity.marine.voyage_stops ADD CONSTRAINT FK__voyage_st__statu__768C7B8D FOREIGN KEY (status_id) REFERENCES klarity.marine.voyage_statuses(status_id);
ALTER TABLE klarity.marine.voyage_stops ADD CONSTRAINT FK__voyage_st__voyag__75985754 FOREIGN KEY (voyage_id) REFERENCES klarity.marine.voyages(voyage_id) ON DELETE CASCADE;


-- klarity.marine.voyages foreign keys

ALTER TABLE klarity.marine.voyages ADD CONSTRAINT FK__voyages__destina__56E8E7AB FOREIGN KEY (destination_id) REFERENCES klarity.logistics.locations(location_id);
ALTER TABLE klarity.marine.voyages ADD CONSTRAINT FK__voyages__origin___55F4C372 FOREIGN KEY (origin_id) REFERENCES klarity.logistics.locations(location_id);
ALTER TABLE klarity.marine.voyages ADD CONSTRAINT FK__voyages__schedul__099F5001 FOREIGN KEY (schedule_id) REFERENCES klarity.marine.voyage_schedules(schedule_id);
ALTER TABLE klarity.marine.voyages ADD CONSTRAINT FK__voyages__status___5AB9788F FOREIGN KEY (status_id) REFERENCES klarity.marine.voyage_statuses(status_id);
ALTER TABLE klarity.marine.voyages ADD CONSTRAINT FK__voyages__vessel___55009F39 FOREIGN KEY (vessel_id) REFERENCES klarity.marine.vessels(vessel_id);