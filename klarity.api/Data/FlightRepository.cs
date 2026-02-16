using Dapper;
using System.Data;
using Klarity.Api.Models;
using Klarity.Api.Models.Aviation;
using Klarity.Api.Utils;

namespace Klarity.Api.Data;

public interface IFlightRepository
{
    Task<IEnumerable<Flight>> GetFlightsAsync();
    Task<IEnumerable<Flight>> GetFlightsByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<Flight?> GetFlightByIdAsync(string flightId);
    Task<IEnumerable<Flight>> GetFlightsByHelicopterIdAsync(string helicopterId);
    Task CreateFlightAsync(Flight flight);
    Task UpdateFlightAsync(Flight flight);
    Task DeleteFlightAsync(string flightId);
    Task AssignItemsToFlightAsync(string flightId, List<string> itemIds);
    Task UnassignItemsFromFlightAsync(string flightId, List<string> itemIds);
    Task RecalculateFlightPaxCountAsync(string flightId);
    Task<IEnumerable<MovementRequest>> GetFlightManifestAsync(string flightId);
    Task<IEnumerable<Flight>> SearchFlightsAsync(string originId, string destinationId, DateTime travelDate, int paxCount);
}


public class FlightRepository : IFlightRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;
    private readonly Dapper.SqlMapper.ICustomQueryParameter _customQueryParameter; // placeholder if needed

    public FlightRepository(IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    public async Task<IEnumerable<Flight>> GetFlightsAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                v.flight_id as FlightId, fs.helicopter_id as HelicopterId, fs.origin_id as OriginId, 
                fs.destination_id as DestinationId, 
                v.plan_depart as DepartureDateTime,
                DATEADD(minute, fs.duration_minutes, v.plan_depart) as ArrivalDateTime,
                v.status_id as StatusId,
                v.pax_count as PaxCurrent,
                12 as PaxCapacity, -- Hardcoded capacity as column is missing
                500 as CostPerPax,
                h.helicopter_name as HelicopterName,
                lo.location_name as OriginName,
                ld.location_name as DestinationName
            FROM aviation.flights v
            INNER JOIN aviation.flight_schedules fs ON v.schedule_id = fs.schedule_id
            INNER JOIN aviation.helicopters h ON fs.helicopter_id = h.helicopter_id
            LEFT JOIN logistics.locations lo ON fs.origin_id = lo.location_id
            LEFT JOIN logistics.locations ld ON fs.destination_id = ld.location_id
            WHERE v.is_deleted = 0;";
        
        return await connection.QueryAsync<Flight>(sql);
    }


    public async Task<IEnumerable<Flight>> GetFlightsByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                v.flight_id as FlightId, fs.helicopter_id as HelicopterId, fs.origin_id as OriginId, 
                fs.destination_id as DestinationId, 
                v.plan_depart as DepartureDateTime,
                DATEADD(minute, fs.duration_minutes, v.plan_depart) as ArrivalDateTime,
                v.status_id as StatusId,
                v.pax_count as PaxCurrent,
                12 as PaxCapacity,
                500 as CostPerPax,
                h.helicopter_name as HelicopterName,
                lo.location_name as OriginName,
                ld.location_name as DestinationName
            FROM aviation.flights v
            INNER JOIN aviation.flight_schedules fs ON v.schedule_id = fs.schedule_id
            INNER JOIN aviation.helicopters h ON fs.helicopter_id = h.helicopter_id
            LEFT JOIN logistics.locations lo ON fs.origin_id = lo.location_id
            LEFT JOIN logistics.locations ld ON fs.destination_id = ld.location_id
            WHERE v.plan_depart >= @startDate AND v.plan_depart <= @endDate AND v.is_deleted = 0";

        return await connection.QueryAsync<Flight>(sql, new { startDate, endDate });
    }


    public async Task<Flight?> GetFlightByIdAsync(string flightId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();

        // 1. Handle virtual flights from schedules
        if (flightId.StartsWith("SCHED-"))
        {
            var firstDash = flightId.IndexOf('-');
            var lastDash = flightId.LastIndexOf('-');
            
            if (firstDash != -1 && lastDash != -1 && firstDash != lastDash)
            {
                var scheduleId = flightId.Substring(firstDash + 1, lastDash - firstDash - 1);
                var dateStr = flightId.Substring(lastDash + 1);

                if (DateTime.TryParseExact(dateStr, "yyyyMMdd", null, System.Globalization.DateTimeStyles.None, out var date))
                {
                    const string scheduleSql = @"
                        SELECT s.*, h.helicopter_name as HelicopterName, 
                                lo.location_name as OriginName, 
                                ld.location_name as DestinationName
                        FROM aviation.flight_schedules s
                        LEFT JOIN aviation.helicopters h ON s.helicopter_id = h.helicopter_id
                        LEFT JOIN logistics.locations lo ON s.origin_id = lo.location_id
                        LEFT JOIN logistics.locations ld ON s.destination_id = ld.location_id
                        WHERE s.schedule_id = @scheduleId";

                    var schedule = await connection.QueryFirstOrDefaultAsync<dynamic>(scheduleSql, new { scheduleId });
                    if (schedule != null)
                    {
                        TimeSpan depTime = (TimeSpan)schedule.departure_time;
                        DateTime depDateTime = date.Add(depTime);
                        
                        return new Flight
                        {
                            FlightId = flightId,
                            HelicopterId = schedule.helicopter_id,
                            HelicopterName = schedule.HelicopterName,
                            OriginId = schedule.origin_id,
                            OriginName = schedule.OriginName,
                            DestinationId = schedule.destination_id,
                            DestinationName = schedule.DestinationName,
                            DepartureDateTime = depDateTime,
                            ArrivalDateTime = depDateTime.AddMinutes((int)schedule.duration_minutes),
                            StatusId = "Scheduled (Auto)",
                            PaxCapacity = 12,
                            PaxCurrent = 0,
                            CostPerPax = 500
                        };
                    }
                }
            }
        }

        // 2. Handle real flights from database
        const string flightSql = @"
            SELECT 
                v.flight_id as FlightId, fs.helicopter_id as HelicopterId, fs.origin_id as OriginId, 
                fs.destination_id as DestinationId, 
                v.plan_depart as DepartureDateTime,
                DATEADD(minute, fs.duration_minutes, v.plan_depart) as ArrivalDateTime,
                v.status_id as StatusId, v.is_deleted as IsDeleted,
                v.pax_count as PaxCurrent,
                12 as PaxCapacity,
                500 as CostPerPax,
                h.helicopter_name as HelicopterName,
                lo.location_name as OriginName,
                ld.location_name as DestinationName
            FROM aviation.flights v
            INNER JOIN aviation.flight_schedules fs ON v.schedule_id = fs.schedule_id
            INNER JOIN aviation.helicopters h ON fs.helicopter_id = h.helicopter_id
            LEFT JOIN logistics.locations lo ON fs.origin_id = lo.location_id
            LEFT JOIN logistics.locations ld ON fs.destination_id = ld.location_id
            WHERE v.flight_id = @flightId AND v.is_deleted = 0";
        
        const string stopsSql = @"
            SELECT s.stop_id as StopId, s.flight_id as FlightId, s.location_id as LocationId, 
                   s.arrival_date_time as ArrivalDateTime, s.departure_date_time as DepartureDateTime,
                   s.status_id as StatusId, l.location_name as LocationName
            FROM aviation.flight_stops s
            LEFT JOIN logistics.locations l ON s.location_id = l.location_id
            WHERE s.flight_id = @flightId";

        var flight = await connection.QueryFirstOrDefaultAsync<Flight>(flightSql, new { flightId });
        if (flight != null)
        {
            var stops = await connection.QueryAsync<FlightStop>(stopsSql, new { flightId });
            flight.Stops = stops.ToList();
        }

        return flight;
    }


    public async Task<IEnumerable<Flight>> GetFlightsByHelicopterIdAsync(string helicopterId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                v.flight_id as FlightId, fs.helicopter_id as HelicopterId, fs.origin_id as OriginId, 
                fs.destination_id as DestinationId, 
                v.plan_depart as DepartureDateTime,
                DATEADD(minute, fs.duration_minutes, v.plan_depart) as ArrivalDateTime,
                v.status_id as StatusId, v.is_deleted as IsDeleted,
                v.pax_count as PaxCurrent,
                12 as PaxCapacity,
                500 as CostPerPax,
                h.helicopter_name as HelicopterName,
                lo.location_name as OriginName,
                ld.location_name as DestinationName
            FROM aviation.flights v
            INNER JOIN aviation.flight_schedules fs ON v.schedule_id = fs.schedule_id
            INNER JOIN aviation.helicopters h ON fs.helicopter_id = h.helicopter_id
            LEFT JOIN logistics.locations lo ON fs.origin_id = lo.location_id
            LEFT JOIN logistics.locations ld ON fs.destination_id = ld.location_id
            WHERE h.helicopter_id = @helicopterId AND v.is_deleted = 0";
        
        return await connection.QueryAsync<Flight>(sql, new { helicopterId });
    }


    public async Task CreateFlightAsync(Flight flight)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        if (string.IsNullOrEmpty(flight.StatusId))
        {
            flight.StatusId = "scheduled";
        }

        const string sql = @"
            INSERT INTO aviation.flights (
                flight_id, schedule_id, status_id, is_deleted,
                pax_count, plan_depart, plan_arrive, created_at
            ) VALUES (
                @FlightId, '', @StatusId, 0,
                @PaxCurrent, @DepartureDateTime, @ArrivalDateTime, GETDATE()
            )";
        
        await connection.ExecuteAsync(sql, flight);
    }


    public async Task UpdateFlightAsync(Flight flight)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            UPDATE aviation.flights SET
                status_id = @StatusId,
                pax_count = @PaxCurrent,
                plan_depart = @DepartureDateTime,
                plan_arrive = @ArrivalDateTime,
                created_at = GETDATE()
            WHERE flight_id = @FlightId";
        
        await connection.ExecuteAsync(sql, flight);

        if (flight.StatusId?.ToLower() == "cancelled")
        {
            await UnassignAllItemsFromFlightAsync(flight.FlightId);
        }
    }


    public async Task DeleteFlightAsync(string flightId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "UPDATE aviation.flights SET is_deleted = 1 WHERE flight_id = @flightId";
        await connection.ExecuteAsync(sql, new { flightId });
        await UnassignAllItemsFromFlightAsync(flightId);
    }

    private async Task UnassignAllItemsFromFlightAsync(string flightId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string getItemsSql = "SELECT item_id FROM aviation.movement_request_items WHERE assigned_flight_id = @flightId";
        var itemIds = await connection.QueryAsync<string>(getItemsSql, new { flightId });
        
        if (itemIds.Any())
        {
            await UnassignItemsFromFlightAsync(flightId, itemIds.ToList());
        }
    }

    public async Task AssignItemsToFlightAsync(string flightId, List<string> itemIds)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        
        const string updateItemSql = @"
            UPDATE aviation.movement_request_items 
            SET assigned_flight_id = @flightId, status = 'Scheduled'
            WHERE item_id = @itemId";
        
        const string updateRequestSql = @"
            UPDATE aviation.movement_requests 
            SET status = 'Scheduled'
            WHERE request_id IN (
                SELECT request_id FROM aviation.movement_request_items WHERE item_id = @itemId
            )";
        
        foreach (var itemId in itemIds)
        {
            await connection.ExecuteAsync(updateItemSql, new { flightId, itemId });
            await connection.ExecuteAsync(updateRequestSql, new { itemId });
        }

        await RecalculateFlightPaxCountAsync(flightId);
    }

    public async Task UnassignItemsFromFlightAsync(string flightId, List<string> itemIds)
    {
        using var connection = _dbConnectionFactory.CreateConnection();

        const string unassignItemSql = @"
            UPDATE aviation.movement_request_items 
            SET assigned_flight_id = NULL, status = 'Approved'
            WHERE item_id = @itemId AND assigned_flight_id = @flightId";
            
        const string checkRequestSql = "SELECT request_id FROM aviation.movement_request_items WHERE item_id = @itemId";

        const string updateRequestSql = @"
            UPDATE aviation.movement_requests 
            SET status = 'Approved'
            WHERE request_id = @requestId 
            AND NOT EXISTS (
                SELECT 1 FROM aviation.movement_request_items 
                WHERE request_id = @requestId AND assigned_flight_id IS NOT NULL
            )";

        foreach (var itemId in itemIds)
        {
            var requestId = await connection.QueryFirstOrDefaultAsync<string>(checkRequestSql, new { itemId });
            await connection.ExecuteAsync(unassignItemSql, new { flightId, itemId });
            if (!string.IsNullOrEmpty(requestId))
            {
                await connection.ExecuteAsync(updateRequestSql, new { requestId });
            }
        }

        await RecalculateFlightPaxCountAsync(flightId);
    }

    public async Task RecalculateFlightPaxCountAsync(string flightId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string countSql = "SELECT COUNT(*) FROM aviation.movement_request_items WHERE assigned_flight_id = @flightId";
        var count = await connection.ExecuteScalarAsync<int>(countSql, new { flightId });
        const string updateSql = "UPDATE aviation.flights SET pax_count = @count WHERE flight_id = @flightId";
        await connection.ExecuteAsync(updateSql, new { flightId, count });
    }

    public async Task<IEnumerable<MovementRequest>> GetFlightManifestAsync(string flightId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                   r.request_id, r.request_date, r.status, 
                   r.origin_id, r.destination_id, 
                   r.earliest_departure, r.latest_arrival, 
                   r.requested_by, r.urgency_id, 
                   r.business_unit_id, r.cost_centre, r.comments,
                   loc_o.location_name as OriginName, loc_d.location_name as DestinationName,
                   i.item_id, i.request_id, i.item_type_id, i.quantity, 
                   i.description, i.weight, i.assigned_flight_id as AssignedVoyageId, i.status, i.is_hazardous
            FROM aviation.movement_requests r
            JOIN aviation.movement_request_items i ON r.request_id = i.request_id
            LEFT JOIN logistics.locations loc_o ON r.origin_id = loc_o.location_id
            LEFT JOIN logistics.locations loc_d ON r.destination_id = loc_d.location_id
            WHERE i.assigned_flight_id = @flightId;";

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
            new { flightId },
            splitOn: "item_id");

        return requestDictionary.Values;
    }


    public async Task<IEnumerable<Flight>> SearchFlightsAsync(string originId, string destinationId, DateTime travelDate, int paxCount)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        var dateOnly = travelDate.Date;
        var startDate = dateOnly; 
        var endDate = dateOnly.AddDays(14).Add(new TimeSpan(23, 59, 59)); // 2 weeks window

        // 1. Get real flights
        const string flightSql = @"
            SELECT 
                v.flight_id as FlightId, fs.helicopter_id as HelicopterId, fs.origin_id as OriginId, 
                fs.destination_id as DestinationId, 
                v.plan_depart as DepartureDateTime,
                DATEADD(minute, fs.duration_minutes, v.plan_depart) as ArrivalDateTime,
                v.status_id as StatusId,
                v.pax_count as PaxCurrent,
                12 as PaxCapacity,
                500 as CostPerPax,
                h.helicopter_name as HelicopterName,
                lo.location_name as OriginName,
                ld.location_name as DestinationName
            FROM aviation.flights v
            INNER JOIN aviation.flight_schedules fs ON v.schedule_id = fs.schedule_id
            INNER JOIN aviation.helicopters h ON fs.helicopter_id = h.helicopter_id
            LEFT JOIN logistics.locations lo ON fs.origin_id = lo.location_id
            LEFT JOIN logistics.locations ld ON fs.destination_id = ld.location_id
            WHERE v.is_deleted = 0
              AND fs.origin_id = @originId
              AND fs.destination_id = @destinationId
              AND v.plan_depart >= @startDate
              AND v.plan_depart <= @endDate
              AND (12 - v.pax_count) >= @paxCount";

        var realFlights = (await connection.QueryAsync<Flight>(flightSql, new { originId, destinationId, startDate, endDate, paxCount })).ToList();

        // 2. Get schedules
        const string scheduleSql = @"
            SELECT s.*, h.helicopter_name as HelicopterName, 
                   lo.location_name as OriginName, 
                   ld.location_name as DestinationName
            FROM aviation.flight_schedules s
            LEFT JOIN aviation.helicopters h ON s.helicopter_id = h.helicopter_id
            LEFT JOIN logistics.locations lo ON s.origin_id = lo.location_id
            LEFT JOIN logistics.locations ld ON s.destination_id = ld.location_id
            WHERE s.origin_id = @originId AND s.destination_id = @destinationId AND s.is_active = 1";

        var schedules = await connection.QueryAsync<dynamic>(scheduleSql, new { originId, destinationId });

        var results = new List<Flight>(realFlights);

        // 3. Materialize virtual flights from schedules for the 14-day window
        for (int i = 0; i <= 14; i++)
        {
            var checkDate = dateOnly.AddDays(i);
            foreach (var schedule in schedules)
            {
                bool applies = false;
                string freq = schedule.frequency;
                
                if (freq == "Daily") applies = true;
                else if (freq == "Weekly")
                {
                    string dayName = checkDate.ToString("ddd"); // Mon, Tue...
                    string days = schedule.days_of_week ?? "";
                    if (days.Contains(dayName)) applies = true;
                }
                else if (freq == "Monthly")
                {
                    if (checkDate.Day == (int)schedule.day_of_month) applies = true;
                }

                if (applies)
                {
                    TimeSpan depTime = (TimeSpan)schedule.departure_time;
                    DateTime depDateTime = checkDate.Add(depTime);
                    depDateTime = DateTime.SpecifyKind(depDateTime, DateTimeKind.Unspecified);
                    
                    // Check if a real flight already exists for this schedule/time (approx check)
                    bool alreadyExists = realFlights.Any(rf => 
                        rf.HelicopterId == (string)schedule.helicopter_id && 
                        Math.Abs((rf.DepartureDateTime - depDateTime).TotalMinutes) < 30);

                    if (!alreadyExists)
                    {
                        var arrival = depDateTime.AddMinutes((int)schedule.duration_minutes);

                        results.Add(new Flight
                        {
                            FlightId = $"SCHED-{schedule.schedule_id}-{checkDate:yyyyMMdd}",
                            HelicopterId = schedule.helicopter_id,
                            HelicopterName = schedule.HelicopterName,
                            OriginId = schedule.origin_id,
                            OriginName = schedule.OriginName,
                            DestinationId = schedule.destination_id,
                            DestinationName = schedule.DestinationName,
                            DepartureDateTime = depDateTime,
                            ArrivalDateTime = depDateTime.AddMinutes((int)schedule.duration_minutes),
                            StatusId = "Scheduled (Auto)",
                            PaxCapacity = 12, // Default
                            PaxCurrent = 0,
                            CostPerPax = 500 // Default
                        });
                    }
                }
            }
        }

        return results.OrderBy(r => r.DepartureDateTime);
    }

}
