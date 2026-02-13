using Dapper;
using Klarity.Api.Models;
using Klarity.Api.Utils;
using System.Data;

namespace Klarity.Api.Data;

public interface IMovementRequestRepository
{
    Task<IEnumerable<MovementRequest>> GetMovementRequestsAsync();
    Task<IEnumerable<MovementRequest>> GetMovementRequestsByAccountAsync(string accountId);
    Task<IEnumerable<MovementRequest>> GetUnscheduledMovementRequestsAsync(string? originId = null, string? destinationId = null);
    Task<MovementRequest?> GetMovementRequestByIdAsync(string requestId);
    Task<IEnumerable<UrgencyOption>> GetUrgenciesAsync();
    Task<IEnumerable<UnitOfMeasurementOption>> GetUnitsOfMeasurementAsync();
    Task<IEnumerable<DimensionUnitOption>> GetDimensionUnitsAsync();
    Task<IEnumerable<WeightUnitOption>> GetWeightUnitsAsync();
    Task<IEnumerable<RequestTypeOption>> GetRequestTypesAsync();
    Task<IEnumerable<BusinessUnitOption>> GetBusinessUnitsAsync();
    Task<IEnumerable<ItemCategoryOption>> GetItemCategoriesAsync();
    Task<IEnumerable<ItemTypeOption>> GetItemTypesAsync();
    Task CreateMovementRequestAsync(MovementRequest request);
    Task UpdateMovementRequestAsync(MovementRequest request);
    Task DeleteMovementRequestAsync(string requestId);
}

public class MovementRequestRepository : IMovementRequestRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    public MovementRequestRepository(IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    public async Task<IEnumerable<MovementRequest>> GetMovementRequestsAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                   r.request_id, r.request_date, r.status, r.schedule_indicator, 
                   r.origin_id, r.destination_id, 
                   r.earliest_departure, r.latest_departure, r.earliest_arrival, r.latest_arrival, 
                   r.requested_by, r.urgency_id, r.is_hazardous, 
                   r.request_type_id, r.transportation_required, r.lifting, 
                   r.business_unit as business_unit_id, r.cost_centre, r.comments, r.notify,
                   u.urgency_label as Urgency,
                   loc_o.location_name as OriginName, loc_d.location_name as DestinationName,
                   i.item_id, i.request_id, i.category_id, i.item_type_id, i.quantity, 
                   i.unit_of_measurement, i.description, i.dimensions, i.dimension_unit, 
                   i.volume, i.weight, i.weight_unit, i.assigned_voyage_id, i.status, i.is_hazardous,
                   it.type_name as ItemTypeName
            FROM marine.movement_requests r
            LEFT JOIN marine.movement_request_items i ON r.request_id = i.request_id
            LEFT JOIN logistics.item_types it ON i.item_type_id = it.type_id
            LEFT JOIN logistics.urgencies u ON r.urgency_id = u.urgency_id
            LEFT JOIN logistics.request_types rt ON r.request_type_id = rt.request_type_id
            LEFT JOIN master.business_units bu ON r.business_unit = bu.business_unit_id
            LEFT JOIN master.cost_centres cc ON r.cost_centre = cc.code
            LEFT JOIN logistics.locations loc_o ON r.origin_id = loc_o.location_id
            LEFT JOIN logistics.locations loc_d ON r.destination_id = loc_d.location_id;";

        var requestDictionary = new Dictionary<string, MovementRequest>();

        var result = await connection.QueryAsync<MovementRequest, MovementRequestItem, MovementRequest>(
            sql,
            (request, item) =>
            {
                if (!requestDictionary.TryGetValue(request.RequestId, out var currentRequest))
                {
                    currentRequest = request;
                    currentRequest.Items = new List<MovementRequestItem>();
                    requestDictionary.Add(currentRequest.RequestId, currentRequest);
                }

                if (item != null)
                {
                    currentRequest.Items.Add(item);
                }

                return currentRequest;
            },
            splitOn: "item_id");

        CalculateTotals(requestDictionary.Values);
        return requestDictionary.Values;
    }
    
    public async Task<IEnumerable<MovementRequest>> GetMovementRequestsByAccountAsync(string accountId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                   r.request_id, r.request_date, r.status, r.schedule_indicator, 
                   r.origin_id, r.destination_id, 
                   r.earliest_departure, r.latest_departure, r.earliest_arrival, r.latest_arrival, 
                   r.requested_by, r.urgency_id, r.is_hazardous, 
                   r.request_type_id, r.transportation_required, r.lifting, 
                   r.business_unit as business_unit_id, r.cost_centre, r.comments, r.notify,
                   u.urgency_label as Urgency,
                   loc_o.location_name as OriginName, loc_d.location_name as DestinationName,
                   i.item_id, i.request_id, i.category_id, i.item_type_id, i.quantity, 
                   i.unit_of_measurement, i.description, i.dimensions, i.dimension_unit, 
                   i.volume, i.weight, i.weight_unit, i.assigned_voyage_id, i.status, i.is_hazardous,
                   it.type_name as ItemTypeName
            FROM marine.movement_requests r
            LEFT JOIN marine.movement_request_items i ON r.request_id = i.request_id
            LEFT JOIN logistics.item_types it ON i.item_type_id = it.type_id
            LEFT JOIN logistics.urgencies u ON r.urgency_id = u.urgency_id
            LEFT JOIN logistics.request_types rt ON r.request_type_id = rt.request_type_id
            LEFT JOIN master.business_units bu ON r.business_unit = bu.business_unit_id
            LEFT JOIN master.cost_centres cc ON r.cost_centre = cc.code
            LEFT JOIN logistics.locations loc_o ON r.origin_id = loc_o.location_id
            LEFT JOIN logistics.locations loc_d ON r.destination_id = loc_d.location_id
            WHERE r.requested_by = @accountId;";

        var requestDictionary = new Dictionary<string, MovementRequest>();

        await connection.QueryAsync<MovementRequest, MovementRequestItem, MovementRequest>(
            sql,
            (request, item) =>
            {
                if (!requestDictionary.TryGetValue(request.RequestId, out var currentRequest))
                {
                    currentRequest = request;
                    currentRequest.Items = new List<MovementRequestItem>();
                    requestDictionary.Add(currentRequest.RequestId, currentRequest);
                }

                if (item != null)
                {
                    currentRequest.Items.Add(item);
                }

                return currentRequest;
            },
            new { accountId },
            splitOn: "item_id");

        CalculateTotals(requestDictionary.Values);
        return requestDictionary.Values;
    }

    public async Task<IEnumerable<MovementRequest>> GetUnscheduledMovementRequestsAsync(string? originId = null, string? destinationId = null)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        var sql = @"
            SELECT 
                   r.request_id, r.request_date, r.status, r.schedule_indicator, 
                   r.origin_id, r.destination_id, 
                   r.earliest_departure, r.latest_departure, r.earliest_arrival, r.latest_arrival, 
                   r.requested_by, r.urgency_id, r.is_hazardous, 
                   r.request_type_id, r.transportation_required, r.lifting, 
                   r.business_unit as business_unit_id, r.cost_centre, r.comments, r.notify,
                   u.urgency_label as Urgency,
                   loc_o.location_name as OriginName, loc_d.location_name as DestinationName,
                   i.item_id, i.request_id, i.category_id, i.item_type_id, i.quantity, 
                   i.unit_of_measurement, i.description, i.dimensions, i.dimension_unit, 
                   i.volume, i.weight, i.weight_unit, i.assigned_voyage_id, i.status, i.is_hazardous,
                   it.type_name as ItemTypeName
            FROM marine.movement_requests r
            JOIN marine.movement_request_items i ON r.request_id = i.request_id
            LEFT JOIN logistics.item_types it ON i.item_type_id = it.type_id
            LEFT JOIN logistics.urgencies u ON r.urgency_id = u.urgency_id
            LEFT JOIN logistics.request_types rt ON r.request_type_id = rt.request_type_id
            LEFT JOIN master.business_units bu ON r.business_unit = bu.business_unit_id
            LEFT JOIN master.cost_centres cc ON r.cost_centre = cc.code
            LEFT JOIN logistics.locations loc_o ON r.origin_id = loc_o.location_id
            LEFT JOIN logistics.locations loc_d ON r.destination_id = loc_d.location_id
            WHERE i.assigned_voyage_id IS NULL AND r.status = 'Approved' or r.status = 'Draft' or r.status = 'Pending'";

        if (!string.IsNullOrEmpty(originId))
        {
            sql += " AND r.origin_id = @originId";
        }
        if (!string.IsNullOrEmpty(destinationId))
        {
            sql += " AND r.destination_id = @destinationId";
        }

        var requestDictionary = new Dictionary<string, MovementRequest>();

        await connection.QueryAsync<MovementRequest, MovementRequestItem, MovementRequest>(
            sql,
            (request, item) =>
            {
                if (!requestDictionary.TryGetValue(request.RequestId, out var currentRequest))
                {
                    currentRequest = request;
                    currentRequest.Items = new List<MovementRequestItem>();
                    requestDictionary.Add(currentRequest.RequestId, currentRequest);
                }

                if (item != null)
                {
                    currentRequest.Items.Add(item);
                }

                return currentRequest;
            },
            new { originId, destinationId },
            splitOn: "item_id");


        CalculateTotals(requestDictionary.Values);
        return requestDictionary.Values;
    }

    public async Task<MovementRequest?> GetMovementRequestByIdAsync(string requestId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                   r.request_id, r.request_date, r.status, r.schedule_indicator, 
                   r.origin_id, r.destination_id, 
                   r.earliest_departure, r.latest_departure, r.earliest_arrival, r.latest_arrival, 
                   r.requested_by, r.urgency_id, r.is_hazardous, 
                   r.request_type_id, r.transportation_required, r.lifting, 
                   r.business_unit as business_unit_id, r.cost_centre, r.comments, r.notify,
                   u.urgency_label as Urgency,
                   loc_o.location_name as OriginName, loc_d.location_name as DestinationName,
                   i.item_id, i.request_id, i.category_id, i.item_type_id, i.quantity, 
                   i.unit_of_measurement, i.description, i.dimensions, i.dimension_unit, 
                   i.volume, i.weight, i.weight_unit, i.assigned_voyage_id, i.status, i.is_hazardous,
                   it.type_name as ItemTypeName
            FROM marine.movement_requests r
            LEFT JOIN marine.movement_request_items i ON r.request_id = i.request_id
            LEFT JOIN logistics.item_types it ON i.item_type_id = it.type_id
            LEFT JOIN logistics.urgencies u ON r.urgency_id = u.urgency_id
            LEFT JOIN logistics.request_types rt ON r.request_type_id = rt.request_type_id
            LEFT JOIN master.business_units bu ON r.business_unit = bu.business_unit_id
            LEFT JOIN master.cost_centres cc ON r.cost_centre = cc.code
            LEFT JOIN logistics.locations loc_o ON r.origin_id = loc_o.location_id
            LEFT JOIN logistics.locations loc_d ON r.destination_id = loc_d.location_id
            WHERE r.request_id = @requestId;";

        var requestDictionary = new Dictionary<string, MovementRequest>();

        var result = await connection.QueryAsync<MovementRequest, MovementRequestItem, MovementRequest>(
            sql,
            (request, item) =>
            {
                if (!requestDictionary.TryGetValue(request.RequestId, out var currentRequest))
                {
                    currentRequest = request;
                    currentRequest.Items = new List<MovementRequestItem>();
                    requestDictionary.Add(currentRequest.RequestId, currentRequest);
                }

                if (item != null)
                {
                    currentRequest.Items.Add(item);
                }

                return currentRequest;
            },
            new { requestId },
            splitOn: "item_id");

        CalculateTotals(requestDictionary.Values);
        return requestDictionary.Values.FirstOrDefault();
    }

    public async Task<IEnumerable<UrgencyOption>> GetUrgenciesAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "SELECT urgency_id, urgency_label, display_order FROM logistics.urgencies ORDER BY display_order;";
        return await connection.QueryAsync<UrgencyOption>(sql);
    }

    public async Task<IEnumerable<UnitOfMeasurementOption>> GetUnitsOfMeasurementAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "SELECT * FROM logistics.units_of_measurement ORDER BY unit_label asc;";
        return await connection.QueryAsync<UnitOfMeasurementOption>(sql);
    }

    public async Task<IEnumerable<DimensionUnitOption>> GetDimensionUnitsAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "SELECT unit_id as UnitId, unit_label as UnitLabel FROM master.dimension_units ORDER BY unit_label asc;";
        return await connection.QueryAsync<DimensionUnitOption>(sql);
    }

    public async Task<IEnumerable<WeightUnitOption>> GetWeightUnitsAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "SELECT unit_id as UnitId, unit_label as UnitLabel FROM master.weight_units ORDER BY unit_label asc;";
        return await connection.QueryAsync<WeightUnitOption>(sql);
    }

    public async Task<IEnumerable<RequestTypeOption>> GetRequestTypesAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "SELECT * FROM logistics.request_types ORDER BY request_type;";
        return await connection.QueryAsync<RequestTypeOption>(sql);
    }

    public async Task<IEnumerable<BusinessUnitOption>> GetBusinessUnitsAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT bu.business_unit_id as BusinessUnitId, bu.business_unit as BusinessUnit, 
                   cc.code, cc.name
            FROM master.business_units bu
            LEFT JOIN master.cost_centres cc ON bu.business_unit_id = cc.unit_id;";

        var buDictionary = new Dictionary<string, BusinessUnitOption>();

        await connection.QueryAsync<BusinessUnitOption, CostCentreOption, BusinessUnitOption>(
            sql,
            (bu, cc) =>
            {
                if (!buDictionary.TryGetValue(bu.BusinessUnitId, out var currentBu))
                {
                    currentBu = bu;
                    currentBu.CostCentres = new List<CostCentreOption>();
                    buDictionary.Add(currentBu.BusinessUnitId, currentBu);
                }

                if (cc != null)
                {
                    currentBu.CostCentres.Add(cc);
                }

                return currentBu;
            },
            splitOn: "Code");

        return buDictionary.Values;
    }

    public async Task<IEnumerable<ItemCategoryOption>> GetItemCategoriesAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "SELECT category_id, category_name FROM logistics.item_categories ORDER BY category_name;";
        return await connection.QueryAsync<ItemCategoryOption>(sql);
    }

    public async Task<IEnumerable<ItemTypeOption>> GetItemTypesAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "SELECT type_id, category_id, type_name FROM logistics.item_types ORDER BY type_name;";
        return await connection.QueryAsync<ItemTypeOption>(sql);
    }

    public async Task CreateMovementRequestAsync(MovementRequest request)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            const string requestSql = @"
                INSERT INTO marine.movement_requests(
                    request_id, request_date, status, schedule_indicator, origin_id, destination_id, 
                    earliest_departure, latest_departure, earliest_arrival, latest_arrival, 
                    requested_by, urgency_id, is_hazardous, request_type_id, transportation_required, 
                    lifting, business_unit, cost_centre, comments, notify
                ) VALUES (
                    @RequestId, @RequestDate, @Status, @ScheduleIndicator, @OriginId, @DestinationId, 
                    @EarliestDeparture, @LatestDeparture, @EarliestArrival, @LatestArrival, 
                    @RequestedBy, @UrgencyId, @IsHazardous, @RequestTypeId, @TransportationRequired, 
                    @Lifting, @BusinessUnitId, @CostCentre, @Comments, @Notify
                );";

            await connection.ExecuteAsync(requestSql, new
            {
                request.RequestId,
                request.RequestDate,
                request.Status,
                request.ScheduleIndicator,
                request.OriginId,
                request.DestinationId,
                request.EarliestDeparture,
                request.LatestDeparture,
                request.EarliestArrival,
                request.LatestArrival,
                request.RequestedBy,
                request.UrgencyId,
                request.IsHazardous,
                request.RequestTypeId,
                request.TransportationRequired,
                request.Lifting,
                request.BusinessUnitId,
                request.CostCentre,
                request.Comments,
                Notify = request.Notify != null ? string.Join(",", request.Notify) : null
            }, transaction);

            if (request.Items != null && request.Items.Any())
            {
                const string itemSql = @"
                    INSERT INTO marine.movement_request_items (
                        item_id, request_id, category_id, item_type_id, quantity, 
                        unit_of_measurement, description, dimensions, dimension_unit, 
                        volume, weight, weight_unit, assigned_voyage_id, status, is_hazardous
                    ) VALUES (
                        @ItemId, @RequestId, @CategoryId, @ItemTypeId, @Quantity, 
                        @UnitOfMeasurement, @Description, @Dimensions, @DimensionUnit, 
                        @Volume, @Weight, @WeightUnit, @AssignedVoyageId, @Status, @IsHazardous
                    );";

                foreach (var item in request.Items)
                {
                    await connection.ExecuteAsync(itemSql, new
                    {
                        item.ItemId,
                        RequestId = request.RequestId,
                        item.CategoryId,
                        item.ItemTypeId,
                        item.Quantity,
                        item.UnitOfMeasurement,
                        item.Description,
                        item.Dimensions,
                        item.DimensionUnit,
                        item.Volume,
                        item.Weight,
                        item.WeightUnit,
                        item.AssignedVoyageId,
                        item.Status,
                        item.IsHazardous
                    }, transaction);
                }
            }

            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task UpdateMovementRequestAsync(MovementRequest request)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            const string requestSql = @"
                UPDATE marine.movement_requests SET
                    request_date = @RequestDate, status = @Status, schedule_indicator = @ScheduleIndicator, 
                    origin_id = @OriginId, destination_id = @DestinationId, earliest_departure = @EarliestDeparture, 
                    latest_departure = @LatestDeparture, earliest_arrival = @EarliestArrival, 
                    latest_arrival = @LatestArrival, requested_by = @RequestedBy, urgency_id = @UrgencyId, 
                    is_hazardous = @IsHazardous, request_type_id = @RequestTypeId, 
                    transportation_required = @TransportationRequired, lifting = @Lifting, 
                    business_unit = @BusinessUnitId, cost_centre = @CostCentre, 
                    comments = @Comments, notify = @Notify
                WHERE request_id = @RequestId;";

            await connection.ExecuteAsync(requestSql, new
            {
                request.RequestId,
                request.RequestDate,
                request.Status,
                request.ScheduleIndicator,
                request.OriginId,
                request.DestinationId,
                request.EarliestDeparture,
                request.LatestDeparture,
                request.EarliestArrival,
                request.LatestArrival,
                request.RequestedBy,
                request.UrgencyId,
                request.IsHazardous,
                request.RequestTypeId,
                request.TransportationRequired,
                request.Lifting,
                request.BusinessUnitId,
                request.CostCentre,
                request.Comments,
                Notify = request.Notify != null ? string.Join(",", request.Notify) : null
            }, transaction);

            // Simple approach: delete existing items and re-insert
            const string deleteItemsSql = "DELETE FROM marine.movement_request_items WHERE request_id = @RequestId;";
            await connection.ExecuteAsync(deleteItemsSql, new { request.RequestId }, transaction);

            if (request.Items != null && request.Items.Any())
            {
                const string itemSql = @"
                    INSERT INTO marine.movement_request_items (
                        item_id, request_id, category_id, item_type_id, quantity, 
                        unit_of_measurement, description, dimensions, dimension_unit, 
                        volume, weight, weight_unit, assigned_voyage_id, status, is_hazardous
                    ) VALUES (
                        @ItemId, @RequestId, @CategoryId, @ItemTypeId, @Quantity, 
                        @UnitOfMeasurement, @Description, @Dimensions, @DimensionUnit, 
                        @Volume, @Weight, @WeightUnit, @AssignedVoyageId, @Status, @IsHazardous
                    );";

                foreach (var item in request.Items)
                {
                    await connection.ExecuteAsync(itemSql, new
                    {
                        item.ItemId,
                        RequestId = request.RequestId,
                        item.CategoryId,
                        item.ItemTypeId,
                        item.Quantity,
                        item.UnitOfMeasurement,
                        item.Description,
                        item.Dimensions,
                        item.DimensionUnit,
                        item.Volume,
                        item.Weight,
                        item.WeightUnit,
                        item.AssignedVoyageId,
                        item.Status,
                        item.IsHazardous
                    }, transaction);
                }
            }

            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task DeleteMovementRequestAsync(string requestId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "DELETE FROM marine.movement_requests WHERE request_id = @requestId;";
        await connection.ExecuteAsync(sql, new { requestId });
    }

    private void CalculateTotals(IEnumerable<MovementRequest> requests)
    {
        foreach (var request in requests)
        {
            request.TotalDeckArea = 0;
            request.TotalWeight = 0;

            foreach (var item in request.Items)
            {
                request.TotalWeight += UnitConverter.ToMetricTonnes(item.Weight ?? 0, item.WeightUnit);

                request.TotalDeckArea += UnitConverter.ToSquareMeters(item.Dimensions, item.DimensionUnit);
            }
        }
    }
}
