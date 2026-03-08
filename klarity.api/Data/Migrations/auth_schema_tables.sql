-- DROP SCHEMA auth;

CREATE SCHEMA auth;
-- klarity.auth.audit_logs definition

-- Drop table

-- DROP TABLE klarity.auth.audit_logs;

CREATE TABLE klarity.auth.audit_logs ( log_id int IDENTITY(1,1) NOT NULL, account_name nvarchar(256) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, [action] nvarchar(256) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, is_successful bit NULL, time_stamp datetime DEFAULT getdate() NULL, request_body nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, controller nvarchar(256) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, error nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, CONSTRAINT PK__audit_lo__9E2397E0CAA92B0E PRIMARY KEY (log_id));


-- klarity.auth.menu_groups definition

-- Drop table

-- DROP TABLE klarity.auth.menu_groups;

CREATE TABLE klarity.auth.menu_groups ( menu_group_id nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, label nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, display_order int DEFAULT 0 NOT NULL, created_at datetime2 DEFAULT sysutcdatetime() NOT NULL, CONSTRAINT PK__menu_gro__952B8570DEE0FD89 PRIMARY KEY (menu_group_id));


-- klarity.auth.roles definition

-- Drop table

-- DROP TABLE klarity.auth.roles;

CREATE TABLE klarity.auth.roles ( role_id nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, role_name nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, created_at datetime2 DEFAULT sysutcdatetime() NOT NULL, description nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, is_active bit DEFAULT 1 NOT NULL, CONSTRAINT PK__roles__760965CCB0B9483C PRIMARY KEY (role_id));


-- klarity.auth.users definition

-- Drop table

-- DROP TABLE klarity.auth.users;

CREATE TABLE klarity.auth.users ( account_id nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, account_name nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, last_login datetime2 NULL, created_at datetime2 DEFAULT sysutcdatetime() NOT NULL, is_active bit DEFAULT 1 NOT NULL, email nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL, CONSTRAINT PK__users__46A222CD0D848667 PRIMARY KEY (account_id));


-- klarity.auth.menu_items definition

-- Drop table

-- DROP TABLE klarity.auth.menu_items;

CREATE TABLE klarity.auth.menu_items ( menu_item_id nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, menu_group_id nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, label nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, [path] nvarchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, display_order int DEFAULT 0 NOT NULL, is_active bit DEFAULT 1 NOT NULL, created_at datetime2 DEFAULT sysutcdatetime() NOT NULL, CONSTRAINT PK__menu_ite__973431D5B84ACCAA PRIMARY KEY (menu_item_id), CONSTRAINT fk_menu_items_menu_groups FOREIGN KEY (menu_group_id) REFERENCES klarity.auth.menu_groups(menu_group_id));


-- klarity.auth.role_menu_access definition

-- Drop table

-- DROP TABLE klarity.auth.role_menu_access;

CREATE TABLE klarity.auth.role_menu_access ( role_menu_access_id nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, role_id nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, menu_item_id nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, can_view bit DEFAULT 1 NOT NULL, created_at datetime2 DEFAULT sysutcdatetime() NOT NULL, CONSTRAINT PK__role_men__ED1AB632232236FD PRIMARY KEY (role_menu_access_id), CONSTRAINT uq_role_menu UNIQUE (role_id,menu_item_id), CONSTRAINT fk_role_menu_access_menu_items FOREIGN KEY (menu_item_id) REFERENCES klarity.auth.menu_items(menu_item_id), CONSTRAINT fk_role_menu_access_roles FOREIGN KEY (role_id) REFERENCES klarity.auth.roles(role_id));


-- klarity.auth.user_roles definition

-- Drop table

-- DROP TABLE klarity.auth.user_roles;

CREATE TABLE klarity.auth.user_roles ( user_role_id nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, account_id nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, role_id nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL, created_at datetime2 DEFAULT sysutcdatetime() NOT NULL, CONSTRAINT PK__user_rol__B8D9ABA2A1D47EE2 PRIMARY KEY (user_role_id), CONSTRAINT uq_user_role UNIQUE (account_id,role_id), CONSTRAINT fk_user_roles_roles FOREIGN KEY (role_id) REFERENCES klarity.auth.roles(role_id), CONSTRAINT fk_user_roles_users FOREIGN KEY (account_id) REFERENCES klarity.auth.users(account_id));



IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('auth.users') AND name = 'is_external')
BEGIN
    ALTER TABLE auth.users ADD is_external BIT NOT NULL DEFAULT 0;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('auth.users') AND name = 'password_hash')
BEGIN
    ALTER TABLE auth.users ADD password_hash NVARCHAR(MAX) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('auth.users') AND name = 'must_change_password')
BEGIN
    ALTER TABLE auth.users ADD must_change_password BIT NOT NULL DEFAULT 0;
END

