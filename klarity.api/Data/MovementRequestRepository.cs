using Dapper;
using Klarity.Api.Models;
using Klarity.Api.Utils;
using System.Data;

namespace Klarity.Api.Data;

public interface IMovementRequestRepository
{
    Task<IEnumerable<MovementRequest>> GetMovementRequestsAsync(DateTime? startDate = null, DateTime? endDate = null, string mode = "Marine");
    Task<(IEnumerable<MovementRequest> Items, int TotalCount)> GetMovementRequestsByAccountAsync(string accountId, int page = 1, int pageSize = 20, string mode = "Marine", DateTime? startDate = null, DateTime? endDate = null);
    Task<IEnumerable<MovementRequest>> GetUnscheduledMovementRequestsAsync(string? originId = null, string? destinationId = null, string mode = "Marine");
    Task<MovementRequest?> GetMovementRequestByIdAsync(string requestId, string mode = "Marine");
    Task<IEnumerable<UrgencyOption>> GetUrgenciesAsync();
    Task<IEnumerable<UnitOfMeasurementOption>> GetUnitsOfMeasurementAsync();
    Task<IEnumerable<DimensionUnitOption>> GetDimensionUnitsAsync();
    Task<IEnumerable<WeightUnitOption>> GetWeightUnitsAsync();
    Task<IEnumerable<RequestTypeOption>> GetRequestTypesAsync(string mode = "Marine");
    Task<IEnumerable<BusinessUnitOption>> GetBusinessUnitsAsync();
    Task<IEnumerable<ItemCategoryOption>> GetItemCategoriesAsync();
    Task<IEnumerable<ItemTypeOption>> GetItemTypesAsync(string? categoryId = null);
    Task<string> CreateMovementRequestAsync(MovementRequest request, string mode = "Marine");
    Task<bool> UpdateMovementRequestAsync(MovementRequest request, string mode = "Marine");
    Task<bool> DeleteMovementRequestAsync(string requestId, string mode = "Marine");
    Task<bool> ApproveRequestAsync(string requestId, string approverId, string comments, string mode = "Marine");
    Task<bool> RejectRequestAsync(string requestId, string approverId, string comments, string mode = "Marine");
    Task<BusinessUnitApprover?> GetApproverForBusinessUnitAsync(string businessUnitId);
}

public class MovementRequestRepository : IMovementRequestRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    public MovementRequestRepository(IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    public async Task<IEnumerable<MovementRequest>> GetMovementRequestsAsync(DateTime? startDate = null, DateTime? endDate = null, string mode = "Marine")
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        string sql;
        if (mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase))
        {
            sql = $@"
                SELECT 
                       r.request_id, r.request_date, r.status, 
                       r.origin_id, r.destination_id, 
                       r.earliest_departure, r.latest_arrival, 
                       r.requested_by, r.urgency_id, 
                       r.business_unit_id, r.cost_centre, r.comments,
                       r.trip_type, r.departure_flight_id as selected_voyage_id, r.return_flight_id as return_voyage_id,
                       r.approver_id, r.approved_at, r.approver_comments,
                       
                       f_out.plan_depart as ScheduledDeparture, f_out.plan_arrive as ScheduledArrival,
                       f_ret.plan_depart as ReturnScheduledDeparture, f_ret.plan_arrive as ReturnScheduledArrival,

                       u.urgency_label as Urgency,
                       loc_o.location_name as OriginName, loc_d.location_name as DestinationName,
                       i.item_id, i.request_id, i.item_type_id, i.quantity, 
                       i.description, i.weight, i.assigned_flight_id as assigned_voyage_id, i.status, i.is_hazardous
                FROM aviation.movement_requests r
                LEFT JOIN aviation.movement_request_items i ON r.request_id = i.request_id
                LEFT JOIN logistics.urgencies u ON r.urgency_id = u.urgency_id
                LEFT JOIN logistics.locations loc_o ON r.origin_id = loc_o.location_id
                LEFT JOIN logistics.locations loc_d ON r.destination_id = loc_d.location_id
                LEFT JOIN aviation.flights f_out ON r.departure_flight_id = f_out.flight_id
                LEFT JOIN aviation.flights f_ret ON r.return_flight_id = f_ret.flight_id
                WHERE r.is_deleted = 0
                  AND (r.earliest_departure >= @StartDate OR @StartDate IS NULL)
                  AND (r.earliest_departure <= @EndDate OR @EndDate IS NULL);";
        }
        else
        {
            sql = @"
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
                LEFT JOIN logistics.locations loc_o ON r.origin_id = loc_o.location_id
                LEFT JOIN logistics.locations loc_d ON r.destination_id = loc_d.location_id
                WHERE r.is_deleted = 0
                  AND (r.earliest_departure >= @StartDate OR @StartDate IS NULL)
                  AND (r.earliest_departure <= @EndDate OR @EndDate IS NULL);";
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
            new { StartDate = startDate, EndDate = endDate },
            splitOn: "item_id");

        CalculateTotals(requestDictionary.Values);
        return requestDictionary.Values;
    }

    public async Task<(IEnumerable<MovementRequest> Items, int TotalCount)> GetMovementRequestsByAccountAsync(string accountId, int page = 1, int pageSize = 20, string mode = "Marine", DateTime? startDate = null, DateTime? endDate = null)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        string schema = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase) ? "aviation" : "marine";
        string requestTable = "movement_requests";

        // 1. Get total count
        string countSql = $@"SELECT COUNT(*) FROM {schema}.{requestTable} r 
                             WHERE r.requested_by = @accountId AND r.is_deleted = 0
                             AND (@startDate IS NULL OR r.request_date >= @startDate)
                             AND (@endDate IS NULL OR r.request_date <= @endDate);";
        int totalCount = await connection.ExecuteScalarAsync<int>(countSql, new { accountId, startDate, endDate });

        if (totalCount == 0) return (Enumerable.Empty<MovementRequest>(), 0);

        // 2. Fetch full data using a subquery for pagination
        int offset = (page - 1) * pageSize;
        string sql;
        if (mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase))
        {
            sql = $@"
                 SELECT 
                       r.request_id, r.request_date, r.status, 
                       r.origin_id, r.destination_id, 
                       r.earliest_departure, r.latest_arrival, 
                       r.requested_by, r.urgency_id, 
                       r.business_unit_id, r.cost_centre, r.comments,
                       r.trip_type, r.departure_flight_id as selected_voyage_id, r.return_flight_id as return_voyage_id,
                       r.approver_id, r.approved_at, r.approver_comments,
                       
                       f_out.plan_depart as ScheduledDeparture, f_out.plan_arrive as ScheduledArrival,
                       f_ret.plan_depart as ReturnScheduledDeparture, f_ret.plan_arrive as ReturnScheduledArrival,

                       u.urgency_label as Urgency,
                       loc_o.location_name as OriginName, loc_d.location_name as DestinationName,
                       i.item_id, i.request_id, i.item_type_id, i.quantity, 
                       i.description, i.weight, i.assigned_flight_id as assigned_voyage_id, i.status, i.is_hazardous
                FROM (
                    SELECT * FROM aviation.movement_requests r
                    WHERE r.requested_by = @accountId AND r.is_deleted = 0
                    AND (r.request_date >= @startDate OR @startDate IS NULL)
                    AND (r.request_date <= @endDate OR @endDate IS NULL)
                    ORDER BY r.request_date DESC 
                    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
                ) r
                LEFT JOIN aviation.movement_request_items i ON r.request_id = i.request_id
                LEFT JOIN logistics.urgencies u ON r.urgency_id = u.urgency_id
                LEFT JOIN logistics.locations loc_o ON r.origin_id = loc_o.location_id
                LEFT JOIN logistics.locations loc_d ON r.destination_id = loc_d.location_id
                LEFT JOIN aviation.flights f_out ON r.departure_flight_id = f_out.flight_id
                LEFT JOIN aviation.flights f_ret ON r.return_flight_id = f_ret.flight_id
                ORDER BY r.request_date DESC;";
        }
        else
        {
            sql = @"
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
                FROM (
                    SELECT * FROM marine.movement_requests r
                    WHERE r.requested_by = @accountId AND r.is_deleted = 0
                    AND (r.earliest_departure >= @startDate OR @startDate IS NULL)
                    AND (r.earliest_departure <= @endDate OR @endDate IS NULL)
                    ORDER BY r.request_date DESC 
                    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
                ) r
                LEFT JOIN marine.movement_request_items i ON r.request_id = i.request_id
                LEFT JOIN logistics.item_types it ON i.item_type_id = it.type_id
                LEFT JOIN logistics.urgencies u ON r.urgency_id = u.urgency_id
                LEFT JOIN logistics.locations loc_o ON r.origin_id = loc_o.location_id
                LEFT JOIN logistics.locations loc_d ON r.destination_id = loc_d.location_id
                ORDER BY r.request_date DESC;";
        }

        var requestDictionary = new Dictionary<string, MovementRequest>();
        var orderedIds = new List<string>();

        await connection.QueryAsync<MovementRequest, MovementRequestItem, MovementRequest>(
            sql,
            (request, item) =>
            {
                if (!requestDictionary.TryGetValue(request.RequestId, out var currentRequest))
                {
                    currentRequest = request;
                    currentRequest.Items = new List<MovementRequestItem>();
                    requestDictionary.Add(currentRequest.RequestId, currentRequest);
                    orderedIds.Add(currentRequest.RequestId);
                }

                if (item != null)
                {
                    currentRequest.Items.Add(item);
                }

                return currentRequest;
            },
                new { 
                    accountId, 
                    offset = (page - 1) * pageSize, 
                    pageSize,
                    startDate,
                    endDate
                },
            splitOn: "item_id");

        CalculateTotals(requestDictionary.Values);

        var sortedResults = orderedIds
            .Select(id => requestDictionary[id])
            .ToList();

        return (sortedResults, totalCount);
    }

    public async Task<IEnumerable<MovementRequest>> GetUnscheduledMovementRequestsAsync(string? originId = null, string? destinationId = null, string mode = "Marine")
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        string sql;
        if (mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase))
        {
            sql = $@"
                SELECT 
                       r.request_id, r.request_date, r.status, 
                       r.origin_id, r.destination_id, 
                       r.earliest_departure, r.latest_arrival, 
                       r.requested_by, r.urgency_id, 
                       r.business_unit_id, r.cost_centre, r.comments,
                       r.trip_type, r.departure_flight_id as selected_voyage_id, r.return_flight_id as return_voyage_id,
                       r.approver_id, r.approved_at, r.approver_comments,
                       
                       f_out.plan_depart as ScheduledDeparture, f_out.plan_arrive as ScheduledArrival,
                       f_ret.plan_depart as ReturnScheduledDeparture, f_ret.plan_arrive as ReturnScheduledArrival,

                       u.urgency_label as Urgency,
                       loc_o.location_name as OriginName, loc_d.location_name as DestinationName,
                       i.item_id, i.request_id, i.item_type_id, i.quantity, 
                       i.description, i.weight, i.assigned_flight_id as assigned_voyage_id, i.status, i.is_hazardous
                FROM aviation.movement_requests r
                LEFT JOIN aviation.movement_request_items i ON r.request_id = i.request_id
                LEFT JOIN logistics.urgencies u ON r.urgency_id = u.urgency_id
                LEFT JOIN logistics.locations loc_o ON r.origin_id = loc_o.location_id
                LEFT JOIN logistics.locations loc_d ON r.destination_id = loc_d.location_id
                LEFT JOIN aviation.flights f_out ON r.departure_flight_id = f_out.flight_id
                LEFT JOIN aviation.flights f_ret ON r.return_flight_id = f_ret.flight_id
                WHERE (r.origin_id = @originId OR @originId IS NULL)
                  AND (r.destination_id = @destinationId OR @destinationId IS NULL)
                  AND r.is_deleted = 0
                  AND EXISTS (
                      SELECT 1 
                      FROM aviation.movement_request_items check_items 
                      WHERE check_items.request_id = r.request_id 
                      AND check_items.assigned_flight_id IS NULL
                  )
                ORDER BY r.request_date DESC;";
        }
        else
        {
            sql = @"
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
                LEFT JOIN logistics.locations loc_o ON r.origin_id = loc_o.location_id
                LEFT JOIN logistics.locations loc_d ON r.destination_id = loc_d.location_id
                WHERE (r.origin_id = @originId OR @originId IS NULL)
                  AND (r.destination_id = @destinationId OR @destinationId IS NULL)
                  AND r.is_deleted = 0
                  AND EXISTS (
                      SELECT 1 
                      FROM marine.movement_request_items check_items 
                      WHERE check_items.request_id = r.request_id 
                      AND check_items.assigned_voyage_id IS NULL
                  )
                ORDER BY r.request_date DESC;";
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

    public async Task<MovementRequest?> GetMovementRequestByIdAsync(string requestId, string mode = "Marine")
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        string sql;
        if (mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase))
        {
            sql = $@"
                SELECT 
                       r.request_id, r.request_date, r.status, 
                       r.origin_id, r.destination_id, 
                       r.earliest_departure, r.latest_arrival, 
                       r.requested_by, r.urgency_id, 
                       r.business_unit_id, r.cost_centre, r.comments,
                       r.trip_type, r.departure_flight_id as selected_voyage_id, r.return_flight_id as return_voyage_id,
                       r.approver_id, r.approved_at, r.approver_comments,
                       f_out.plan_depart as ScheduledDeparture, f_out.plan_arrive as ScheduledArrival,
                       f_ret.plan_depart as ReturnScheduledDeparture, f_ret.plan_arrive as ReturnScheduledArrival,
                       u.urgency_label as Urgency,
                       loc_o.location_name as OriginName, loc_d.location_name as DestinationName,
                       i.item_id, i.request_id, i.item_type_id, i.quantity, 
                       i.description, i.weight, i.assigned_flight_id as assigned_voyage_id, i.status, i.is_hazardous
                FROM aviation.movement_requests r
                LEFT JOIN aviation.movement_request_items i ON r.request_id = i.request_id
                LEFT JOIN logistics.urgencies u ON r.urgency_id = u.urgency_id
                LEFT JOIN logistics.locations loc_o ON r.origin_id = loc_o.location_id
                LEFT JOIN logistics.locations loc_d ON r.destination_id = loc_d.location_id
                LEFT JOIN aviation.flights f_out ON r.departure_flight_id = f_out.flight_id
                LEFT JOIN aviation.flights f_ret ON r.return_flight_id = f_ret.flight_id
                WHERE r.request_id = @requestId AND r.is_deleted = 0;";
        }
        else
        {
            sql = @"
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
                LEFT JOIN logistics.locations loc_o ON r.origin_id = loc_o.location_id
                LEFT JOIN logistics.locations loc_d ON r.destination_id = loc_d.location_id
                WHERE r.request_id = @requestId AND r.is_deleted = 0;";
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

    public async Task<IEnumerable<RequestTypeOption>> GetRequestTypesAsync(string mode = "Marine")
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        string schema = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase) ? "aviation" : "logistics";
        string sql = $"SELECT * FROM {schema}.request_types ORDER BY request_type;";
        return await connection.QueryAsync<RequestTypeOption>(sql);
    }

    public async Task<IEnumerable<BusinessUnitOption>> GetBusinessUnitsAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT bu.unit_id as BusinessUnitId, bu.unit_name as BusinessUnit, 
                   cc.code, cc.name
            FROM master.business_units bu
            LEFT JOIN master.cost_centres cc ON bu.unit_id = cc.unit_id;";

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

    public async Task<IEnumerable<ItemTypeOption>> GetItemTypesAsync(string? categoryId = null)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        var sql = "SELECT type_id as TypeId, category_id as CategoryId, type_name as TypeName FROM logistics.item_types";

        if (!string.IsNullOrEmpty(categoryId))
        {
            sql += " WHERE category_id = @categoryId";
            return await connection.QueryAsync<ItemTypeOption>(sql, new { categoryId });
        }

        return await connection.QueryAsync<ItemTypeOption>(sql);
    }

    public async Task<string> CreateMovementRequestAsync(MovementRequest request, string mode = "Marine")
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        string schema = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase) ? "aviation" : "marine";
        string itemTable = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase) ? "movement_request_items" : "movement_request_items";
        string requestTable = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase) ? "movement_requests" : "movement_requests";
        string assignedField = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase) ? "assigned_flight_id" : "assigned_voyage_id";

        try
        {
            string requestSql;
            if (mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase))
            {
                requestSql = @"
                    INSERT INTO aviation.movement_requests(
                        request_id, request_date, status, origin_id, destination_id, 
                        earliest_departure, latest_arrival, 
                        requested_by, urgency_id, business_unit_id, cost_centre, comments,
                        trip_type, departure_flight_id, return_flight_id
                    ) VALUES (
                        @RequestId, @RequestDate, @Status, @OriginId, @DestinationId, 
                        @EarliestDeparture, @LatestArrival, 
                        @RequestedBy, @UrgencyId, @BusinessUnitId, @CostCentre, @Comments,
                        @TripType, @SelectedVoyageId, @ReturnVoyageId
                    );";
            }
            else
            {
                requestSql = @"
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
            }

            // --- Auto-Assign Flights Logic ---
            if (mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase))
            {
                // Calculate Pax Count (more robust check for Pax)
                int paxCount = 0;
                if (request.Items != null)
                {
                    // Assuming 'ItemTypeId' for Pax might be 'Pax' or similar ID. 
                    // Also checking Description if it contains "Pax" as a fallback or if UnitOfMeasurement is Pax.
                    // Adjust as per actual data.
                    paxCount = request.Items
                        .Where(i => (i.UnitOfMeasurement?.Equals("Pax", StringComparison.OrdinalIgnoreCase) == true) ||
                                    (i.ItemTypeId != null && (i.ItemTypeId.Equals("Pax", StringComparison.OrdinalIgnoreCase) == true || i.ItemTypeId.Equals("personnel", StringComparison.OrdinalIgnoreCase) == true)))
                        .Sum(i => (int)i.Quantity);
                }

                // Outbound Flight
                if (request.EarliestDeparture != default)
                {
                    var flightId = await EnsureFlightExistsAsync(connection, transaction, request.OriginId, request.DestinationId, request.EarliestDeparture, paxCount);
                    if (flightId != null)
                    {
                        request.SelectedVoyageId = flightId;
                    }
                }

                // Return Flight
                if (request.TripType == "RoundTrip" && !string.IsNullOrEmpty(request.ReturnEarliestDeparture))
                {
                    if (DateTime.TryParse(request.ReturnEarliestDeparture, out DateTime returnTime))
                    {
                        var flightId = await EnsureFlightExistsAsync(connection, transaction, request.DestinationId, request.OriginId, returnTime, paxCount);
                        if (flightId != null)
                        {
                            request.ReturnVoyageId = flightId;
                        }
                    }
                }
            }
            // ---------------------------------

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
                Notify = request.Notify != null ? string.Join(",", request.Notify) : null,
                request.TripType,
                SelectedVoyageId = request.SelectedVoyageId,
                ReturnVoyageId = request.ReturnVoyageId
            }, transaction);

            if (request.Items != null && request.Items.Any())
            {
                string itemSql = $@"
                    INSERT INTO {schema}.{itemTable} (
                        item_id, request_id, item_type_id, quantity, 
                        description, weight, {assignedField}, status, is_hazardous
                    ) VALUES (
                        @ItemId, @RequestId, @ItemTypeId, @Quantity, 
                        @Description, @Weight, @AssignedVoyageId, @Status, @IsHazardous
                    );";

                if (mode == "Marine")
                {
                    itemSql = @"
                        INSERT INTO marine.movement_request_items (
                            item_id, request_id, category_id, item_type_id, quantity, 
                            unit_of_measurement, description, dimensions, dimension_unit, 
                            volume, weight, weight_unit, assigned_voyage_id, status, is_hazardous
                        ) VALUES (
                            @ItemId, @RequestId, @CategoryId, @ItemTypeId, @Quantity, 
                            @UnitOfMeasurement, @Description, @Dimensions, @DimensionUnit, 
                            @Volume, @Weight, @WeightUnit, @AssignedVoyageId, @Status, @IsHazardous
                        );";
                }

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
                        AssignedVoyageId = item.AssignedVoyageId,
                        item.Status,
                        item.IsHazardous
                    }, transaction);
                }
            }

            transaction.Commit();
            return request.RequestId;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    private async Task<string?> EnsureFlightExistsAsync(IDbConnection connection, IDbTransaction transaction, string originId, string destinationId, DateTime scheduleTime, int paxCount)
    {
        // 1. Find the Schedule ID matching the plan (origin, dest, departure time)
        // Note: Casting scheduleTime to TIME for comparison with flight_schedules.departure_time
        const string findScheduleSql = @"
            SELECT top 1 schedule_id, duration_minutes 
            FROM aviation.flight_schedules 
            WHERE origin_id = @originId 
              AND destination_id = @destinationId 
              AND departure_time = CAST(@scheduleTime AS TIME)
              AND is_active = 1;";

        var schedule = await connection.QueryFirstOrDefaultAsync<dynamic>(findScheduleSql, new { originId, destinationId, scheduleTime }, transaction);

        if (schedule == null)
        {
            // If no schedule exists, we can't create a flight based on a schedule. 
            // Returning null means no flight assigned.
            return null;
        }

        string scheduleId = schedule.schedule_id;
        int durationMinutes = (int)schedule.duration_minutes;
        DateTime planArrive = scheduleTime.AddMinutes(durationMinutes);

        // 2. Check if a flight already exists for this schedule and plan_depart
        const string checkFlightSql = @"
            SELECT flight_id 
            FROM aviation.flights 
            WHERE schedule_id = @scheduleId 
              AND plan_depart = @scheduleTime
              AND is_deleted = 0;";

        var existingFlightId = await connection.ExecuteScalarAsync<string>(checkFlightSql, new { scheduleId, scheduleTime }, transaction);

        if (existingFlightId != null)
        {
            // 3. Update existing flight pax count
            const string updateSql = "UPDATE aviation.flights SET pax_current = pax_current + @paxCount WHERE flight_id = @existingFlightId;";
            await connection.ExecuteAsync(updateSql, new { paxCount, existingFlightId }, transaction);
            return existingFlightId;
        }
        else
        {
            // 4. Create new flight
            string newFlightId = "FL-" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();

            const string insertFlightSql = @"
                INSERT INTO aviation.flights (
                    flight_id, schedule_id, pax_current, status_id, is_deleted, plan_depart, plan_arrive,
                    origin_id, destination_id, pax_capacity -- Keeping existing cols populated too
                ) VALUES (
                    @newFlightId, @scheduleId, @paxCount, 'Scheduled', 0, @scheduleTime, @planArrive,
                    @originId, @destinationId, 12
                );";

            await connection.ExecuteAsync(insertFlightSql, new
            {
                newFlightId,
                scheduleId,
                paxCount,
                scheduleTime,
                planArrive,
                originId,
                destinationId
            }, transaction);

            return newFlightId;
        }
    }

    public async Task<bool> UpdateMovementRequestAsync(MovementRequest request, string mode = "Marine")
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        string schema = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase) ? "aviation" : "marine";
        string itemTable = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase) ? "movement_request_items" : "movement_request_items";
        string requestTable = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase) ? "movement_requests" : "movement_requests";
        string assignedField = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase) ? "assigned_flight_id" : "assigned_voyage_id";

        try
        {
            string requestSql;
            if (mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase))
            {
                requestSql = @"
                    UPDATE aviation.movement_requests SET
                        request_date = @RequestDate, status = @Status, 
                        origin_id = @OriginId, destination_id = @DestinationId, earliest_departure = @EarliestDeparture, 
                        latest_arrival = @LatestArrival, requested_by = @RequestedBy, urgency_id = @UrgencyId, 
                        business_unit_id = @BusinessUnitId, cost_centre = @CostCentre, 
                        comments = @Comments, trip_type = @TripType,
                        departure_flight_id = @SelectedVoyageId, return_flight_id = @ReturnVoyageId
                    WHERE request_id = @RequestId;";
            }
            else
            {
                requestSql = @"
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
            }

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
                Notify = request.Notify != null ? string.Join(",", request.Notify) : null,
                request.TripType,
                SelectedVoyageId = request.SelectedVoyageId,
                ReturnVoyageId = request.ReturnVoyageId
            }, transaction);

            // Simple approach: delete existing items and re-insert
            string deleteItemsSql = $"DELETE FROM {schema}.{itemTable} WHERE request_id = @RequestId;";
            await connection.ExecuteAsync(deleteItemsSql, new { request.RequestId }, transaction);

            if (request.Items != null && request.Items.Any())
            {
                string itemSql = $@"
                    INSERT INTO {schema}.{itemTable} (
                        item_id, request_id, item_type_id, quantity, 
                        description, weight, {assignedField}, status, is_hazardous
                    ) VALUES (
                        @ItemId, @RequestId, @ItemTypeId, @Quantity, 
                        @Description, @Weight, @AssignedVoyageId, @Status, @IsHazardous
                    );";

                if (mode == "Marine")
                {
                    itemSql = @"
                        INSERT INTO marine.movement_request_items (
                            item_id, request_id, category_id, item_type_id, quantity, 
                            unit_of_measurement, description, dimensions, dimension_unit, 
                            volume, weight, weight_unit, assigned_voyage_id, status, is_hazardous
                        ) VALUES (
                            @ItemId, @RequestId, @CategoryId, @ItemTypeId, @Quantity, 
                            @UnitOfMeasurement, @Description, @Dimensions, @DimensionUnit, 
                            @Volume, @Weight, @WeightUnit, @AssignedVoyageId, @Status, @IsHazardous
                        );";
                }

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
                        AssignedVoyageId = item.AssignedVoyageId,
                        item.Status,
                        item.IsHazardous
                    }, transaction);
                }
            }

            transaction.Commit();
            return true;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<bool> DeleteMovementRequestAsync(string requestId, string mode = "Marine")
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        string schema = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase) ? "aviation" : "marine";
        string requestTable = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase) ? "movement_requests" : "movement_requests";

        string sql = $@"
            UPDATE {schema}.{requestTable} 
            SET is_deleted = 1, status = 'Cancelled' 
            WHERE request_id = @requestId;";

        var rowsAffected = await connection.ExecuteAsync(sql, new { requestId });
        return rowsAffected > 0;
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

    public async Task<bool> ApproveRequestAsync(string requestId, string approverId, string comments, string mode = "Marine")
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        string schema = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase) ? "aviation" : "marine";
        string requestTable = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase) ? "movement_requests" : "movement_requests";

        string sql;
        if (mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase))
        {
            sql = @"
                UPDATE aviation.movement_requests 
                SET status = 'Approved', 
                    approver_id = @approverId, 
                    approved_at = GETDATE(), 
                    approver_comments = @comments
                WHERE request_id = @requestId AND is_deleted = 0;";
        }
        else
        {
            sql = @"
                UPDATE marine.movement_requests 
                SET status = 'Approved'
                WHERE request_id = @requestId AND is_deleted = 0;";
        }

        var rowsAffected = await connection.ExecuteAsync(sql, new { requestId, approverId, comments });
        return rowsAffected > 0;
    }

    public async Task<bool> RejectRequestAsync(string requestId, string approverId, string comments, string mode = "Marine")
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        string schema = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase) ? "aviation" : "marine";
        string requestTable = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase) ? "movement_requests" : "movement_requests";

        string sql;
        if (mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase))
        {
            sql = @"
                UPDATE aviation.movement_requests 
                SET status = 'Rejected', 
                    approver_id = @approverId, 
                    approved_at = GETDATE(), 
                    approver_comments = @comments
                WHERE request_id = @requestId AND is_deleted = 0;";
        }
        else
        {
            sql = @"
                UPDATE marine.movement_requests 
                SET status = 'Rejected'
                WHERE request_id = @requestId AND is_deleted = 0;";
        }

        var rowsAffected = await connection.ExecuteAsync(sql, new { requestId, approverId, comments });
        return rowsAffected > 0;
    }

    public async Task<BusinessUnitApprover?> GetApproverForBusinessUnitAsync(string businessUnitId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT bua.business_unit_id, bua.approver_id, 
                   u.account_name as approver_name, u.email as approver_email, bua.is_primary
            FROM master.business_unit_approvers bua
            LEFT JOIN auth.users u ON bua.approver_id = u.account_id
            WHERE bua.business_unit_id = @businessUnitId AND bua.is_primary = 1;";

        return await connection.QueryFirstOrDefaultAsync<BusinessUnitApprover>(sql, new { businessUnitId });
    }
}
