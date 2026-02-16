-- Rename columns in aviation.helicopters to remove 'vessel' terminology
-- Simplified version without GO-split transactions

-- Rename vessel_id to helicopter_id
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[aviation].[helicopters]') AND name = 'vessel_id')
BEGIN
    EXEC sp_rename '[aviation].[helicopters].[vessel_id]', 'helicopter_id', 'COLUMN';
END;

-- Rename vessel_name to helicopter_name
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[aviation].[helicopters]') AND name = 'vessel_name')
BEGIN
    EXEC sp_rename '[aviation].[helicopters].[vessel_name]', 'helicopter_name', 'COLUMN';
END;

-- Rename vessel_type_id to helicopter_type_id
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[aviation].[helicopters]') AND name = 'vessel_type_id')
BEGIN
    EXEC sp_rename '[aviation].[helicopters].[vessel_type_id]', 'helicopter_type_id', 'COLUMN';
END;
