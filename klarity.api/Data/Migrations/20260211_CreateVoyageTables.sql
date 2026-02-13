-- Create voyage_statuses table
IF OBJECT_ID('marine.voyage_statuses', 'U') IS NOT NULL
    DROP TABLE marine.voyage_statuses;
GO

CREATE TABLE marine.voyage_statuses (
    status_id VARCHAR(50) PRIMARY KEY,
    status NVARCHAR(50) NOT NULL
);
GO

INSERT INTO marine.voyage_statuses (status_id, status) VALUES 
('scheduled', 'Scheduled'),
('enroute', 'Enroute'),
('delayed', 'Delayed'),
('arrived', 'Arrived');
GO

-- Create voyages table
IF OBJECT_ID('marine.voyages', 'U') IS NOT NULL
    DROP TABLE marine.voyages;
GO

CREATE TABLE marine.voyages (
    voyage_id VARCHAR(50) PRIMARY KEY,
    vessel_id VARCHAR(50) NOT NULL REFERENCES marine.vessels(vessel_id),
    origin_id VARCHAR(50) NOT NULL REFERENCES logistics.locations(location_id),
    destination_id VARCHAR(50) NOT NULL REFERENCES logistics.locations(location_id),
    departure_date_time DATETIME2 NOT NULL,
    eta DATETIME2 NOT NULL,
    weight_util FLOAT NOT NULL DEFAULT 0,
    deck_util FLOAT NOT NULL DEFAULT 0,
    cabin_util FLOAT NOT NULL DEFAULT 0,
    status_id VARCHAR(50) REFERENCES marine.voyage_statuses(status_id) DEFAULT 'scheduled'
);
GO

-- Create voyage_stops table
IF OBJECT_ID('marine.voyage_stops', 'U') IS NOT NULL
    DROP TABLE marine.voyage_stops;
GO

CREATE TABLE marine.voyage_stops (
    stop_id VARCHAR(50) PRIMARY KEY,
    voyage_id VARCHAR(50) NOT NULL REFERENCES marine.voyages(voyage_id) ON DELETE CASCADE,
    location_id VARCHAR(50) NOT NULL,
    arrival_date_time DATETIME2 NOT NULL,
    departure_date_time DATETIME2 NOT NULL,
    status_id VARCHAR(50) REFERENCES marine.voyage_statuses(status_id) DEFAULT 'scheduled'
);
GO

-- Insert Initial Mock Voyages
INSERT INTO marine.voyages (voyage_id, vessel_id, origin_id, destination_id, departure_date_time, eta, weight_util, deck_util, cabin_util, status_id) VALUES 
('v1-voy1', 'v1', 'onne', 'bonga', '2026-02-11T08:00:00', '2026-02-12T08:00:00', 45, 60, 20, 'enroute'),
('v3-voy1', 'v3', 'ladol', 'horizon', '2026-02-11T10:00:00', '2026-02-13T10:00:00', 30, 40, 15, 'scheduled');

-- Insert Initial Mock Stops
INSERT INTO marine.voyage_stops (stop_id, voyage_id, location_id, arrival_date_time, departure_date_time, status_id) VALUES 
('v1-voy1-s1', 'v1-voy1', 'onne', '2026-02-11T07:00:00', '2026-02-11T08:00:00', 'arrived'),
('v1-voy1-s2', 'v1-voy1', 'bonga', '2026-02-12T08:00:00', '2026-02-12T20:00:00', 'scheduled'),
('v3-voy1-s1', 'v3-voy1', 'ladol', '2026-02-11T09:00:00', '2026-02-11T10:00:00', 'scheduled');
