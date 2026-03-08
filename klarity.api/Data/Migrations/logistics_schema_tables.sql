-- DROP SCHEMA logistics;

CREATE SCHEMA logistics;
-- klarity.logistics.item_categories definition

-- Drop table

-- DROP TABLE klarity.logistics.item_categories;

CREATE TABLE klarity.logistics.item_categories ( category_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, category_name nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, CONSTRAINT PK__item_cat__D54EE9B47369D852 PRIMARY KEY (category_id));


-- klarity.logistics.locations definition

-- Drop table

-- DROP TABLE klarity.logistics.locations;

CREATE TABLE klarity.logistics.locations ( location_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, location_name nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, location_type nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, latitude float NULL, longitude float NULL, CONSTRAINT PK__location__771831EA1070829D PRIMARY KEY (location_id));


-- klarity.logistics.request_types definition

-- Drop table

-- DROP TABLE klarity.logistics.request_types;

CREATE TABLE klarity.logistics.request_types ( request_type_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, request_type nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, CONSTRAINT PK__request___C24DD950FF6CD016 PRIMARY KEY (request_type_id));


-- klarity.logistics.units_of_measurement definition

-- Drop table

-- DROP TABLE klarity.logistics.units_of_measurement;

CREATE TABLE klarity.logistics.units_of_measurement ( unit_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, unit_label nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, display_order int NOT NULL, CONSTRAINT PK__units_of__D3AF5BD75B413B7F PRIMARY KEY (unit_id));


-- klarity.logistics.urgencies definition

-- Drop table

-- DROP TABLE klarity.logistics.urgencies;

CREATE TABLE klarity.logistics.urgencies ( urgency_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, urgency_label nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, display_order int NOT NULL, CONSTRAINT PK__urgencie__D6899F8CBD8AFA37 PRIMARY KEY (urgency_id));


-- klarity.logistics.item_types definition

-- Drop table

-- DROP TABLE klarity.logistics.item_types;

CREATE TABLE klarity.logistics.item_types ( type_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, category_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, type_name nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, CONSTRAINT PK__item_typ__2C0005982DB7C7AA PRIMARY KEY (type_id), CONSTRAINT FK__item_type__categ__0015E5C7 FOREIGN KEY (category_id) REFERENCES klarity.logistics.item_categories(category_id));