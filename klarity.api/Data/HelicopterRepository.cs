using Dapper;
using Klarity.Api.Models;

namespace Klarity.Api.Data;

public interface IHelicopterRepository
{
    Task<IEnumerable<Helicopter>> GetHelicoptersAsync(string? statusId = null);
    Task<Helicopter?> GetHelicopterByIdAsync(string helicopterId);
    Task CreateHelicopterAsync(Helicopter helicopter);
    Task UpdateHelicopterAsync(Helicopter helicopter);
    Task DeleteHelicopterAsync(string helicopterId);
}

public class HelicopterRepository : IHelicopterRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    public HelicopterRepository(IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    public async Task<IEnumerable<Helicopter>> GetHelicoptersAsync(string? statusId = null)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        string sql = @"
            SELECT 
                v.helicopter_id as HelicopterId,
                v.helicopter_name as HelicopterName,
                v.helicopter_type_id as HelicopterTypeId,
                v.status_id as StatusId,
                v.owner as Owner,
                v.cruise_airspeed_kts as CruiseAirspeedKts,
                v.basic_operating_weight_lb as BasicOperatingWeightLb,
                v.max_gross_weight_lb as MaxGrossWeightLb,
                v.available_payload_lb as AvailablePayloadLb,
                v.max_fuel_gal as MaxFuelGal,
                v.max_fuel_lb as MaxFuelLb,
                v.endurance_hours as EnduranceHours,
                v.range_nm as RangeNm,
                v.passenger_seats as PassengerSeats,
                vt.type_name as HelicopterTypeName,
                vs.status_name as Status
            FROM aviation.helicopters v
            LEFT JOIN marine.vessel_category_types vt ON v.helicopter_type_id = vt.category_type_id
            LEFT JOIN marine.vessel_statuses vs ON v.status_id = vs.status_id
            WHERE (v.status_id = @statusId OR @statusId IS NULL)
              AND v.is_deleted = 0;";
        
        return await connection.QueryAsync<Helicopter>(sql, new { statusId });
    }

    public async Task<Helicopter?> GetHelicopterByIdAsync(string helicopterId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        string sql = @"
            SELECT 
                v.helicopter_id as HelicopterId,
                v.helicopter_name as HelicopterName,
                v.helicopter_type_id as HelicopterTypeId,
                v.status_id as StatusId,
                v.owner as Owner,
                v.cruise_airspeed_kts as CruiseAirspeedKts,
                v.basic_operating_weight_lb as BasicOperatingWeightLb,
                v.max_gross_weight_lb as MaxGrossWeightLb,
                v.available_payload_lb as AvailablePayloadLb,
                v.max_fuel_gal as MaxFuelGal,
                v.max_fuel_lb as MaxFuelLb,
                v.endurance_hours as EnduranceHours,
                v.range_nm as RangeNm,
                v.passenger_seats as PassengerSeats,
                vt.type_name as HelicopterTypeName,
                vs.status_name as Status
            FROM aviation.helicopters v
            LEFT JOIN marine.vessel_category_types vt ON v.helicopter_type_id = vt.category_type_id
            LEFT JOIN marine.vessel_statuses vs ON v.status_id = vs.status_id
            WHERE v.helicopter_id = @helicopterId AND v.is_deleted = 0;";
            
        return await connection.QueryFirstOrDefaultAsync<Helicopter>(sql, new { helicopterId });
    }

    public async Task CreateHelicopterAsync(Helicopter helicopter)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        string sql = @"
            INSERT INTO aviation.helicopters (
                helicopter_id, helicopter_name, helicopter_type_id, status_id,
                owner, cruise_airspeed_kts, basic_operating_weight_lb, 
                max_gross_weight_lb, available_payload_lb, max_fuel_gal, 
                max_fuel_lb, endurance_hours, range_nm, passenger_seats
            ) VALUES (
                @HelicopterId, @HelicopterName, @HelicopterTypeId, @StatusId,
                @Owner, @CruiseAirspeedKts, @BasicOperatingWeightLb, 
                @MaxGrossWeightLb, @AvailablePayloadLb, @MaxFuelGal, 
                @MaxFuelLb, @EnduranceHours, @RangeNm, @PassengerSeats
            );";
            
        await connection.ExecuteAsync(sql, helicopter);
    }

    public async Task UpdateHelicopterAsync(Helicopter helicopter)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        string sql = @"
            UPDATE aviation.helicopters SET
                helicopter_name = @HelicopterName,
                helicopter_type_id = @HelicopterTypeId,
                status_id = @StatusId,
                owner = @Owner,
                cruise_airspeed_kts = @CruiseAirspeedKts,
                basic_operating_weight_lb = @BasicOperatingWeightLb,
                max_gross_weight_lb = @MaxGrossWeightLb,
                available_payload_lb = @AvailablePayloadLb,
                max_fuel_gal = @MaxFuelGal,
                max_fuel_lb = @MaxFuelLb,
                endurance_hours = @EnduranceHours,
                range_nm = @RangeNm,
                passenger_seats = @PassengerSeats
            WHERE helicopter_id = @HelicopterId;";
            
        await connection.ExecuteAsync(sql, helicopter);
    }

    public async Task DeleteHelicopterAsync(string helicopterId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        string sql = "UPDATE aviation.helicopters SET is_deleted = 1 WHERE helicopter_id = @helicopterId;";
        await connection.ExecuteAsync(sql, new { helicopterId });
    }
}
