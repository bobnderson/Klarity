-- Final Robust Bulk Insert Script for Test Movement Requests
-- Targets 'klarity' database specifically
SET NOCOUNT ON;
SET XACT_ABORT ON;

-- 1. SWITCH TO CORRECT DATABASE
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'klarity')
BEGIN
    USE [klarity];
    PRINT 'Using [klarity] database.';
END
ELSE
BEGIN
    PRINT 'ERROR: [klarity] database not found. Please ensure you are connected to the correct server.';
    -- RETURN; -- Uncomment this line in a real execution environment if needed, but for script visibility we'll continue
END

-- 2. VERIFY TABLES EXIST
IF OBJECT_ID('marine.movement_requests', 'U') IS NULL
BEGIN
    PRINT 'ERROR: Table marine.movement_requests not found in database ' + DB_NAME() + '.';
    PRINT 'Please check your schema or run migrations first.';
END
ELSE
BEGIN
    PRINT 'Table marine.movement_requests found. Proceeding...';

    DECLARE @RequestCounter INT = 1;
    DECLARE @InsertedRequests INT = 0;
    DECLARE @InsertedItems INT = 0;
    DECLARE @BaseDate DATETIME2 = GETDATE();

    BEGIN TRANSACTION;

    BEGIN TRY
        -- Clean up previous test data if any from same seed prefix to avoid PK conflicts
        DELETE FROM marine.movement_request_items WHERE request_id LIKE 'MR-SEED-%';
        DELETE FROM marine.movement_requests WHERE request_id LIKE 'MR-SEED-%';

        WHILE @RequestCounter <= 50
        BEGIN
            DECLARE @RequestId VARCHAR(50) = 'MR-SEED-' + RIGHT('000' + CAST(@RequestCounter AS VARCHAR), 3);
            
            -- Cycle locations (Valid GUIDs from logistics.locations or IDs loc-001...)
            DECLARE @OriginId VARCHAR(50) = CASE (@RequestCounter % 6)
                WHEN 0 THEN 'loc-001' WHEN 1 THEN 'loc-003' WHEN 2 THEN 'loc-005'
                WHEN 3 THEN 'loc-002' WHEN 4 THEN 'loc-004' ELSE 'loc-006' END;

            DECLARE @DestinationId VARCHAR(50) = CASE ((@RequestCounter + 1) % 6)
                WHEN 0 THEN 'loc-001' WHEN 1 THEN 'loc-003' WHEN 2 THEN 'loc-005'
                WHEN 3 THEN 'loc-002' WHEN 4 THEN 'loc-004' ELSE 'loc-006' END;

            DECLARE @UrgencyId VARCHAR(50) = CASE (@RequestCounter % 4)
                WHEN 0 THEN 'routine' WHEN 1 THEN 'priority' WHEN 2 THEN 'urgent' ELSE 'critical' END;

            INSERT INTO marine.movement_requests (
                request_id, request_date, status, schedule_indicator, origin_id, destination_id, 
                earliest_departure, latest_departure, earliest_arrival, latest_arrival, 
                requested_by, urgency_id, is_hazardous, transportation_required, business_unit, comments
            ) VALUES (
                @RequestId, @BaseDate, 'Approved', 'Unscheduled', @OriginId, @DestinationId,
                DATEADD(DAY, 1, @BaseDate), DATEADD(DAY, 3, @BaseDate), 
                DATEADD(DAY, 2, @BaseDate), DATEADD(DAY, 14, @BaseDate),
                'bobby.ekpo', @UrgencyId, 0, 1, 'BU-LOGISTICS', 'Seeded test data'
            );
            SET @InsertedRequests = @InsertedRequests + 1;

            DECLARE @ItemCounter INT = 1;
            WHILE @ItemCounter <= 20
            BEGIN
                DECLARE @ItemId VARCHAR(50) = @RequestId + '-ITM-' + RIGHT('00' + CAST(@ItemCounter AS VARCHAR), 2);
                
                INSERT INTO marine.movement_request_items (
                    item_id, request_id, category_id, item_type_id, quantity, 
                    unit_of_measurement, description, dimensions, dimension_unit, weight, weight_unit, status, is_hazardous
                ) VALUES (
                    @ItemId, @RequestId, 'cargo', 'gen-cargo', 5, 'tonnes', 
                    'Item ' + CAST(@ItemCounter AS VARCHAR), '1.0 x 1.0 x 1.0', 'm3', 1.0, 'tonnes', 'Approved', 0
                );
                SET @InsertedItems = @InsertedItems + 1;
                SET @ItemCounter = @ItemCounter + 1;
            END

            SET @RequestCounter = @RequestCounter + 1;
        END

        COMMIT TRANSACTION;
        PRINT 'SUCCESS: Transaction committed in database ' + DB_NAME() + '.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        PRINT 'ERROR: ' + ERROR_MESSAGE();
    END CATCH

    -- Final verification
    PRINT '---------------------------------------';
    PRINT 'Seed Statistics:';
    PRINT 'Inserted Requests: ' + CAST(@InsertedRequests AS VARCHAR);
    PRINT 'Inserted Items:    ' + CAST(@InsertedItems AS VARCHAR);
    PRINT 'Total Requests now in ' + DB_NAME() + ': ' + CAST((SELECT COUNT(*) FROM marine.movement_requests) AS VARCHAR);
    PRINT 'Total Items now in ' + DB_NAME() + ':    ' + CAST((SELECT COUNT(*) FROM marine.movement_request_items) AS VARCHAR);
    PRINT '---------------------------------------';
END
GO
