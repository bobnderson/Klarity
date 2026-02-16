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
    RETURN;
END

-- 2. VERIFY TABLES EXIST
IF OBJECT_ID('marine.movement_requests', 'U') IS NULL
BEGIN
    PRINT 'ERROR: Table marine.movement_requests not found in database ' + DB_NAME() + '.';
    RETURN;
END

-- 3. CHECK FOR VALID REFERENCE DATA
PRINT 'Checking for valid reference data...';

-- Check if locations exist
DECLARE @LocationCount INT;
SELECT @LocationCount = COUNT(*) FROM logistics.locations;

IF @LocationCount = 0
BEGIN
    PRINT 'WARNING: No locations found in logistics.locations. Using default values but may fail.';
END
ELSE
BEGIN
    PRINT 'Found ' + CAST(@LocationCount AS VARCHAR) + ' locations.';
END

-- Check for valid urgency values in logistics.urgencies
DECLARE @UrgencyCount INT;
SELECT @UrgencyCount = COUNT(*) FROM logistics.urgencies;

IF @UrgencyCount = 0
BEGIN
    PRINT 'WARNING: No urgency types found in logistics.urgencies. Using default values but may fail.';
END
ELSE
BEGIN
    PRINT 'Found ' + CAST(@UrgencyCount AS VARCHAR) + ' urgency types.';
END

-- Check for valid item categories
DECLARE @CategoryCount INT;
SELECT @CategoryCount = COUNT(*) FROM logistics.item_categories;

IF @CategoryCount = 0
BEGIN
    PRINT 'WARNING: No item categories found in logistics.item_categories. Using default values but may fail.';
END
ELSE
BEGIN
    PRINT 'Found ' + CAST(@CategoryCount AS VARCHAR) + ' item categories.';
END

-- Check for valid item types
DECLARE @ItemTypeCount INT;
SELECT @ItemTypeCount = COUNT(*) FROM logistics.item_types;

IF @ItemTypeCount = 0
BEGIN
    PRINT 'WARNING: No item types found in logistics.item_types. Using default values but may fail.';
END
ELSE
BEGIN
    PRINT 'Found ' + CAST(@ItemTypeCount AS VARCHAR) + ' item types.';
END

BEGIN TRANSACTION;

BEGIN TRY
    -- Clean up previous test data if any from same seed prefix
    DELETE FROM marine.movement_request_items WHERE request_id LIKE 'MR-SEED-%';
    DELETE FROM marine.movement_requests WHERE request_id LIKE 'MR-SEED-%';
    
    PRINT 'Cleaned up existing seed data.';

    DECLARE @RequestCounter INT = 1;
    DECLARE @InsertedRequests INT = 0;
    DECLARE @InsertedItems INT = 0;
    DECLARE @BaseDate DATETIME2 = GETDATE();
    
    -- Category 1: Past dates (1-30 days ago)
    -- Category 2: Current dates (today +/- 15 days)
    -- Category 3: Future dates (30-90 days from now)
    
    WHILE @RequestCounter <= 50
    BEGIN
        DECLARE @RequestId VARCHAR(50) = 'MR-SEED-' + RIGHT('000' + CAST(@RequestCounter AS VARCHAR), 3);
        
        -- Determine which date category this request falls into (spread evenly)
        DECLARE @DateCategory INT = ((@RequestCounter - 1) / 17) + 1; -- 50/3 ≈ 17 per category
        
        DECLARE @EarliestDeparture DATETIME2;
        DECLARE @LatestDeparture DATETIME2;
        DECLARE @EarliestArrival DATETIME2;
        DECLARE @LatestArrival DATETIME2;
        
        -- Set dates based on category
        IF @DateCategory = 1
        BEGIN
            -- Past dates (completed movements)
            SET @EarliestDeparture = DATEADD(DAY, -30 + (@RequestCounter % 10), @BaseDate);
            SET @LatestDeparture = DATEADD(DAY, -25 + (@RequestCounter % 10), @BaseDate);
            SET @EarliestArrival = DATEADD(DAY, -20 + (@RequestCounter % 10), @BaseDate);
            SET @LatestArrival = DATEADD(DAY, -15 + (@RequestCounter % 10), @BaseDate);
            SET @RequestId = 'MR-SEED-PAST-' + RIGHT('000' + CAST(@RequestCounter AS VARCHAR), 3);
        END
        ELSE IF @DateCategory = 2
        BEGIN
            -- Current dates (in-progress/upcoming)
            SET @EarliestDeparture = DATEADD(DAY, -5 + (@RequestCounter % 10), @BaseDate);
            SET @LatestDeparture = DATEADD(DAY, 5 + (@RequestCounter % 10), @BaseDate);
            SET @EarliestArrival = DATEADD(DAY, 10 + (@RequestCounter % 10), @BaseDate);
            SET @LatestArrival = DATEADD(DAY, 20 + (@RequestCounter % 10), @BaseDate);
            SET @RequestId = 'MR-SEED-CURRENT-' + RIGHT('000' + CAST(@RequestCounter AS VARCHAR), 3);
        END
        ELSE
        BEGIN
            -- Future dates (planned movements)
            SET @EarliestDeparture = DATEADD(DAY, 30 + (@RequestCounter % 20), @BaseDate);
            SET @LatestDeparture = DATEADD(DAY, 45 + (@RequestCounter % 20), @BaseDate);
            SET @EarliestArrival = DATEADD(DAY, 50 + (@RequestCounter % 20), @BaseDate);
            SET @LatestArrival = DATEADD(DAY, 75 + (@RequestCounter % 20), @BaseDate);
            SET @RequestId = 'MR-SEED-FUTURE-' + RIGHT('000' + CAST(@RequestCounter AS VARCHAR), 3);
        END
        
        -- Get valid location IDs from the actual table
        DECLARE @OriginId VARCHAR(50);
        DECLARE @DestinationId VARCHAR(50);
        
        -- Try to get real location IDs
        SELECT TOP 1 @OriginId = location_id 
        FROM logistics.locations 
        ORDER BY NEWID(); -- Random location
        
        SELECT TOP 1 @DestinationId = location_id 
        FROM logistics.locations 
        WHERE location_id != @OriginId -- Different from origin
        ORDER BY NEWID();
        
        -- Fallback if no locations found
        IF @OriginId IS NULL SET @OriginId = 'loc-001';
        IF @DestinationId IS NULL SET @DestinationId = 'loc-002';
        
        -- Get valid urgency ID from logistics.urgencies
        DECLARE @UrgencyId VARCHAR(50);
        
        -- Try to get real urgency ID
        SELECT TOP 1 @UrgencyId = urgency_id 
        FROM logistics.urgencies 
        ORDER BY NEWID();
        
        -- Fallback if no urgencies found
        IF @UrgencyId IS NULL
        BEGIN
            SET @UrgencyId = CASE (@RequestCounter % 4)
                WHEN 0 THEN 'routine' WHEN 1 THEN 'priority' 
                WHEN 2 THEN 'urgent' ELSE 'critical' 
            END;
        END
        
        -- Determine status based on dates
        DECLARE @Status VARCHAR(50);
        IF @DateCategory = 1
            SET @Status = 'Completed';
        ELSE IF @DateCategory = 2 AND @EarliestDeparture < @BaseDate
            SET @Status = 'In-Transit';
        ELSE
            SET @Status = 'Approved';
        
        -- Get a valid request_type_id from the available types
        DECLARE @RequestTypeId VARCHAR(50) = CASE (@RequestCounter % 4)
            WHEN 0 THEN 'bck-001'   -- Backhaul
            WHEN 1 THEN 'ift-001'   -- In-field Transfer
            WHEN 2 THEN 'ofd-001'   -- Offshore Delivery
            ELSE 'vtv-001'           -- Vendor to Vendor
        END;
        
        -- Get valid business_unit_id
        DECLARE @BusinessUnitId VARCHAR(50) = CASE (@RequestCounter % 3)
            WHEN 0 THEN 'bu-001'  -- Upstream Nigeria
            WHEN 1 THEN 'bu-002'  -- Deepwater Operations
            ELSE 'bu-003'          -- Logistics Services
        END;
        
        -- Get valid cost_centre_id based on business unit
        DECLARE @CostCentreId VARCHAR(50);
        
        IF @BusinessUnitId = 'bu-001' -- Upstream Nigeria
        BEGIN
            SET @CostCentreId = CASE (@RequestCounter % 2)
                WHEN 0 THEN '1'  -- CC-101 Exploration
                ELSE '2'          -- CC-102 Production
            END;
        END
        ELSE IF @BusinessUnitId = 'bu-002' -- Deepwater Operations
        BEGIN
            SET @CostCentreId = CASE (@RequestCounter % 2)
                WHEN 0 THEN '3'  -- CC-201 Bonga Operations
                ELSE '4'          -- CC-202 Maintenance
            END;
        END
        ELSE -- bu-003 Logistics Services
        BEGIN
            SET @CostCentreId = CASE (@RequestCounter % 2)
                WHEN 0 THEN '5'  -- CC-301 Marine Logistics
                ELSE '6'          -- CC-302 Aviation
            END;
        END
        
        INSERT INTO marine.movement_requests (
            request_id, 
            request_date, 
            status, 
            schedule_indicator, 
            origin_id, 
            destination_id, 
            earliest_departure, 
            latest_departure, 
            earliest_arrival, 
            latest_arrival, 
            requested_by, 
            urgency_id, 
            is_hazardous, 
            request_type_id,
            transportation_required, 
            business_unit,        -- This stores business_unit_id
            cost_centre,          -- This stores cost_centre_id
            comments
        ) VALUES (
            @RequestId, 
            DATEADD(DAY, -(@RequestCounter % 30), @BaseDate), -- Request date varies
            @Status, 
            'Unscheduled', 
            @OriginId, 
            @DestinationId,
            @EarliestDeparture, 
            @LatestDeparture, 
            @EarliestArrival, 
            @LatestArrival,
            'bobby.ekpo', 
            @UrgencyId, 
            CASE WHEN @RequestCounter % 3 = 0 THEN 1 ELSE 0 END, -- Some hazardous (1/3 of requests)
            @RequestTypeId,
            CASE WHEN @RequestCounter % 5 = 0 THEN 0 ELSE 1 END, -- Transportation required varies
            @BusinessUnitId,
            @CostCentreId,
            'Seeded test data - Category ' + CAST(@DateCategory AS VARCHAR) + 
            ' - Type: ' + @RequestTypeId + 
            ' - BU: ' + @BusinessUnitId
        );
        
        SET @InsertedRequests = @InsertedRequests + 1;

        -- Insert items (5-20 items per request, varies)
        DECLARE @ItemCounter INT = 1;
        DECLARE @MaxItems INT = 5 + (@RequestCounter % 16); -- Between 5 and 20 items
        
        WHILE @ItemCounter <= @MaxItems
        BEGIN
            DECLARE @ItemId VARCHAR(50) = @RequestId + '-ITM-' + RIGHT('00' + CAST(@ItemCounter AS VARCHAR), 2);
            
            -- Determine category and type based on counter
            DECLARE @CategoryId VARCHAR(50);
            DECLARE @TypeId VARCHAR(50);
            
            -- Mix of cargo and personnel items (80% cargo, 20% personnel)
            IF (@ItemCounter % 5 = 0) -- 20% personnel items
            BEGIN
                SET @CategoryId = 'personnel';
                -- Cycle through personnel types
                SET @TypeId = CASE (@ItemCounter % 4)
                    WHEN 0 THEN 'crew-change'
                    WHEN 1 THEN 'technicians'
                    WHEN 2 THEN 'visitors'
                    ELSE 'medevac'
                END;
            END
            ELSE -- 80% cargo items
            BEGIN
                SET @CategoryId = 'cargo';
                -- Cycle through cargo types
                SET @TypeId = CASE (@ItemCounter % 7)
                    WHEN 0 THEN 'gen-cargo'
                    WHEN 1 THEN 'containers'
                    WHEN 2 THEN 'drill-pipes'
                    WHEN 3 THEN 'casing'
                    WHEN 4 THEN 'provisions'
                    WHEN 5 THEN 'chemicals'
                    ELSE 'fuel'
                END;
            END
            
            -- Vary item details
            DECLARE @Quantity INT = 1 + (@ItemCounter % 10);
            DECLARE @Weight DECIMAL(10,2) = 0.5 + (@ItemCounter % 20);
            
            -- Adjust weight and dimensions for personnel items
            DECLARE @Dimensions VARCHAR(50);
            DECLARE @UnitOfMeasure VARCHAR(20);
            
            IF @CategoryId = 'personnel'
            BEGIN
                SET @UnitOfMeasure = 'persons';
                SET @Dimensions = 'N/A';
                SET @Weight = 0; -- Weight not applicable for personnel
            END
            ELSE
            BEGIN
                SET @UnitOfMeasure = CASE WHEN @RequestCounter % 2 = 0 THEN 'tonnes' ELSE 'units' END;
                SET @Dimensions = CAST(@ItemCounter % 5 + 1 AS VARCHAR) + '.0 x ' + 
                                 CAST(@ItemCounter % 3 + 1 AS VARCHAR) + '.0 x ' + 
                                 CAST(@ItemCounter % 4 + 1 AS VARCHAR) + '.0';
            END
            
            INSERT INTO marine.movement_request_items (
                item_id, 
                request_id, 
                category_id,        -- Changed from consignment_type_id
                item_type_id, 
                quantity, 
                unit_of_measurement, 
                description, 
                dimensions, 
                weight, 
                status, 
                is_hazardous
            ) VALUES (
                @ItemId, 
                @RequestId, 
                @CategoryId,         -- Now using category_id from logistics.item_categories
                @TypeId,             -- Now using type_id from logistics.item_types
                @Quantity, 
                @UnitOfMeasure,
                CASE WHEN @CategoryId = 'personnel' 
                    THEN @TypeId + ' personnel for ' + @RequestId
                    ELSE 'Item ' + CAST(@ItemCounter AS VARCHAR) + ' for request ' + @RequestId 
                END,
                @Dimensions,
                @Weight, 
                @Status, 
                CASE WHEN @CategoryId = 'personnel' THEN 0  -- Personnel aren't hazardous
                     WHEN @ItemCounter % 5 = 0 THEN 1      -- Some cargo items hazardous
                     ELSE 0 
                END
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
    IF @@TRANCOUNT > 0 
    BEGIN
        ROLLBACK TRANSACTION;
        PRINT 'TRANSACTION ROLLED BACK.';
    END
    
    PRINT 'ERROR: ' + ERROR_MESSAGE();
    PRINT 'ERROR Severity: ' + CAST(ERROR_SEVERITY() AS VARCHAR);
    PRINT 'ERROR State: ' + CAST(ERROR_STATE() AS VARCHAR);
    PRINT 'ERROR Line: ' + CAST(ERROR_LINE() AS VARCHAR);
END CATCH

-- Final verification
PRINT '---------------------------------------';
PRINT 'Seed Statistics:';
PRINT 'Inserted Requests: ' + CAST(@InsertedRequests AS VARCHAR);
PRINT 'Inserted Items:    ' + CAST(@InsertedItems AS VARCHAR);
PRINT 'Total Requests now in ' + DB_NAME() + ': ' + CAST((SELECT COUNT(*) FROM marine.movement_requests) AS VARCHAR);
PRINT 'Total Items now in ' + DB_NAME() + ':    ' + CAST((SELECT COUNT(*) FROM marine.movement_request_items) AS VARCHAR);
PRINT '---------------------------------------';

-- Show distribution by date category
PRINT 'Date Distribution:';
PRINT 'Past requests: ' + CAST((SELECT COUNT(*) FROM marine.movement_requests WHERE request_id LIKE 'MR-SEED-PAST-%') AS VARCHAR);
PRINT 'Current requests: ' + CAST((SELECT COUNT(*) FROM marine.movement_requests WHERE request_id LIKE 'MR-SEED-CURRENT-%') AS VARCHAR);
PRINT 'Future requests: ' + CAST((SELECT COUNT(*) FROM marine.movement_requests WHERE request_id LIKE 'MR-SEED-FUTURE-%') AS VARCHAR);
PRINT '---------------------------------------';

-- Show distribution by request type
PRINT 'Request Type Distribution:';
PRINT 'Backhaul (bck-001): ' + CAST((SELECT COUNT(*) FROM marine.movement_requests WHERE request_type_id = 'bck-001') AS VARCHAR);
PRINT 'In-field Transfer (ift-001): ' + CAST((SELECT COUNT(*) FROM marine.movement_requests WHERE request_type_id = 'ift-001') AS VARCHAR);
PRINT 'Offshore Delivery (ofd-001): ' + CAST((SELECT COUNT(*) FROM marine.movement_requests WHERE request_type_id = 'ofd-001') AS VARCHAR);
PRINT 'Vendor to Vendor (vtv-001): ' + CAST((SELECT COUNT(*) FROM marine.movement_requests WHERE request_type_id = 'vtv-001') AS VARCHAR);
PRINT '---------------------------------------';

-- Show distribution by business unit
PRINT 'Business Unit Distribution:';
PRINT 'Upstream Nigeria (bu-001): ' + CAST((SELECT COUNT(*) FROM marine.movement_requests WHERE business_unit = 'bu-001') AS VARCHAR);
PRINT 'Deepwater Operations (bu-002): ' + CAST((SELECT COUNT(*) FROM marine.movement_requests WHERE business_unit = 'bu-002') AS VARCHAR);
PRINT 'Logistics Services (bu-003): ' + CAST((SELECT COUNT(*) FROM marine.movement_requests WHERE business_unit = 'bu-003') AS VARCHAR);
PRINT '---------------------------------------';

-- Show distribution by cost centre
PRINT 'Cost Centre Distribution:';
PRINT 'Exploration (1): ' + CAST((SELECT COUNT(*) FROM marine.movement_requests WHERE cost_centre = '1') AS VARCHAR);
PRINT 'Production (2): ' + CAST((SELECT COUNT(*) FROM marine.movement_requests WHERE cost_centre = '2') AS VARCHAR);
PRINT 'Bonga Operations (3): ' + CAST((SELECT COUNT(*) FROM marine.movement_requests WHERE cost_centre = '3') AS VARCHAR);
PRINT 'Maintenance (4): ' + CAST((SELECT COUNT(*) FROM marine.movement_requests WHERE cost_centre = '4') AS VARCHAR);
PRINT 'Marine Logistics (5): ' + CAST((SELECT COUNT(*) FROM marine.movement_requests WHERE cost_centre = '5') AS VARCHAR);
PRINT 'Aviation (6): ' + CAST((SELECT COUNT(*) FROM marine.movement_requests WHERE cost_centre = '6') AS VARCHAR);
PRINT '---------------------------------------';

-- Show distribution by item category
PRINT 'Item Category Distribution:';
PRINT 'Cargo items: ' + CAST((SELECT COUNT(*) FROM marine.movement_request_items mi 
                              JOIN logistics.item_types it ON mi.item_type_id = it.type_id
                              WHERE it.category_id = 'cargo') AS VARCHAR);
PRINT 'Personnel items: ' + CAST((SELECT COUNT(*) FROM marine.movement_request_items mi 
                                   JOIN logistics.item_types it ON mi.item_type_id = it.type_id
                                   WHERE it.category_id = 'personnel') AS VARCHAR);
PRINT '---------------------------------------';