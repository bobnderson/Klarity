-- DROP SCHEMA [system];

CREATE SCHEMA [system];
-- klarity.[system].settings definition

-- Drop table

-- DROP TABLE klarity.[system].settings;

CREATE TABLE klarity.[system].settings ( [key] varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, value text COLLATE SQL_Latin1_General_CP1_CI_AS NULL, description varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, [group] varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, updated_at datetime DEFAULT getdate() NULL, updated_by varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, CONSTRAINT PK__settings__DFD83CAE14697F80 PRIMARY KEY ([key]));