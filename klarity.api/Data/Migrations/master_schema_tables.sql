-- DROP SCHEMA master;

CREATE SCHEMA master;
-- klarity.master.business_unit_approvers definition

-- Drop table

-- DROP TABLE klarity.master.business_unit_approvers;

CREATE TABLE klarity.master.business_unit_approvers ( business_unit_id nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, approver_id nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, is_primary bit DEFAULT 1 NULL, CONSTRAINT PK_BusinessUnitApprovers PRIMARY KEY (business_unit_id,approver_id));


-- klarity.master.business_units definition

-- Drop table

-- DROP TABLE klarity.master.business_units;

CREATE TABLE klarity.master.business_units ( unit_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, unit_name nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, CONSTRAINT PK__business__D3AF5BD70E353AC6 PRIMARY KEY (unit_id));


-- klarity.master.dimension_units definition

-- Drop table

-- DROP TABLE klarity.master.dimension_units;

CREATE TABLE klarity.master.dimension_units ( unit_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, unit_label nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, CONSTRAINT PK__dimensio__D3AF5BD72E9425F8 PRIMARY KEY (unit_id));


-- klarity.master.notification_templates definition

-- Drop table

-- DROP TABLE klarity.master.notification_templates;

CREATE TABLE klarity.master.notification_templates ( template_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, template_name varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, subject varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, body_html nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, description varchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, created_at datetime DEFAULT getdate() NULL, updated_at datetime DEFAULT getdate() NULL, CONSTRAINT PK__notifica__BE44E079DB66258B PRIMARY KEY (template_id));


-- klarity.master.weight_units definition

-- Drop table

-- DROP TABLE klarity.master.weight_units;

CREATE TABLE klarity.master.weight_units ( unit_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, unit_label nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, CONSTRAINT PK__weight_u__D3AF5BD79A905256 PRIMARY KEY (unit_id));


-- klarity.master.cost_centres definition

-- Drop table

-- DROP TABLE klarity.master.cost_centres;

CREATE TABLE klarity.master.cost_centres ( cost_centre_id int IDENTITY(1,1) NOT NULL, code varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, name nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, unit_id varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, CONSTRAINT PK__cost_cen__DF70BE05D2ADA48C PRIMARY KEY (cost_centre_id), CONSTRAINT FK__cost_cent__unit___609D3A6E FOREIGN KEY (unit_id) REFERENCES klarity.master.business_units(unit_id) ON DELETE CASCADE);