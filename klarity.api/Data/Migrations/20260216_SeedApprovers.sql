-- Seed default approvers for Business Units
-- Assign 'bobby.ekpo' as approver for all BUs for testing purposes

-- Aviation (Logistics Services)
IF NOT EXISTS (SELECT 1 FROM master.business_unit_approvers WHERE business_unit_id = 'bu-003')
BEGIN
    INSERT INTO master.business_unit_approvers (business_unit_id, approver_id, is_primary)
    VALUES ('bu-003', 'bobby.ekpo', 1);
END

-- Upstream Nigeria
IF NOT EXISTS (SELECT 1 FROM master.business_unit_approvers WHERE business_unit_id = 'bu-001')
BEGIN
    INSERT INTO master.business_unit_approvers (business_unit_id, approver_id, is_primary)
    VALUES ('bu-001', 'bobby.ekpo', 1);
END

-- Deepwater Operations
IF NOT EXISTS (SELECT 1 FROM master.business_unit_approvers WHERE business_unit_id = 'bu-002')
BEGIN
    INSERT INTO master.business_unit_approvers (business_unit_id, approver_id, is_primary)
    VALUES ('bu-002', 'bobby.ekpo', 1);
END
GO
