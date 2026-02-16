-- Migration script for Aviation Flight Search & Approval System

-- 1. Update marine.voyages with cost and capacity fields
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('marine.voyages') AND name = 'cost_per_pax')
BEGIN
    ALTER TABLE marine.voyages ADD cost_per_pax DECIMAL(18, 2) NULL;
    ALTER TABLE marine.voyages ADD pax_capacity INT NULL;
    ALTER TABLE marine.voyages ADD pax_current INT NULL;
END
GO

-- 2. Update marine.movement_requests with flight selection and approval fields
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('marine.movement_requests') AND name = 'trip_type')
BEGIN
    ALTER TABLE marine.movement_requests ADD trip_type NVARCHAR(20) NULL;
    ALTER TABLE marine.movement_requests ADD selected_voyage_id NVARCHAR(50) NULL;
    ALTER TABLE marine.movement_requests ADD return_voyage_id NVARCHAR(50) NULL;
    ALTER TABLE marine.movement_requests ADD approver_id NVARCHAR(100) NULL;
    ALTER TABLE marine.movement_requests ADD approved_at DATETIME NULL;
    ALTER TABLE marine.movement_requests ADD approver_comments NVARCHAR(MAX) NULL;
END
GO

-- 3. Create master.business_unit_approvers table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE object_id = OBJECT_ID('master.business_unit_approvers'))
BEGIN
    CREATE TABLE master.business_unit_approvers (
        business_unit_id NVARCHAR(50) NOT NULL,
        approver_id NVARCHAR(100) NOT NULL,
        is_primary BIT DEFAULT 1,
        CONSTRAINT PK_BusinessUnitApprovers PRIMARY KEY (business_unit_id, approver_id)
    );
END
GO

-- 4. Seed some sample data for testing
-- Note: Assuming existing BU IDs like 'bu-1', 'bu-2' and user 'admin'
INSERT INTO master.business_unit_approvers (business_unit_id, approver_id, is_primary)
SELECT 'bu-1', 'admin', 1
WHERE NOT EXISTS (SELECT 1 FROM master.business_unit_approvers WHERE business_unit_id = 'bu-1');

UPDATE marine.voyages 
SET cost_per_pax = 250.00, pax_capacity = 12, pax_current = 0
WHERE vessel_id IN (SELECT vessel_id FROM marine.vessels WHERE vessel_type_id IN (SELECT category_type_id FROM marine.vessel_category_types WHERE type_name = 'Helicopter'));
GO
