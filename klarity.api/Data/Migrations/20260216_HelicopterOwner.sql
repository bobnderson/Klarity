-- Migration to add owner to aviation.helicopters
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('aviation.helicopters') AND name = 'owner')
BEGIN
    ALTER TABLE aviation.helicopters ADD owner NVARCHAR(255);
END
GO
