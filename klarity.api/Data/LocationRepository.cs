using Dapper;
using Klarity.Api.Models;

namespace Klarity.Api.Data;

public interface ILocationRepository
{
    Task<IEnumerable<Location>> GetLocationsAsync();
    Task<Location?> GetLocationByIdAsync(string locationId);
    Task CreateLocationAsync(Location location);
    Task UpdateLocationAsync(Location location);
    Task DeleteLocationAsync(string locationId);
}

public class LocationRepository : ILocationRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    public LocationRepository(IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    public async Task<IEnumerable<Location>> GetLocationsAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "SELECT location_id, location_name, location_type, latitude, longitude FROM logistics.locations;";
        return await connection.QueryAsync<Location>(sql);
    }

    public async Task<Location?> GetLocationByIdAsync(string locationId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "SELECT location_id, location_name, location_type, latitude, longitude FROM logistics.locations WHERE location_id = @locationId;";
        return await connection.QueryFirstOrDefaultAsync<Location>(sql, new { locationId });
    }

    public async Task CreateLocationAsync(Location location)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "INSERT INTO logistics.locations (location_id, location_name, location_type, latitude, longitude) VALUES (@LocationId, @LocationName, @LocationType, @Latitude, @Longitude);";
        await connection.ExecuteAsync(sql, location);
    }

    public async Task UpdateLocationAsync(Location location)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "UPDATE logistics.locations SET location_name = @LocationName, location_type = @LocationType, latitude = @Latitude, longitude = @Longitude WHERE location_id = @LocationId;";
        await connection.ExecuteAsync(sql, location);
    }

    public async Task DeleteLocationAsync(string locationId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "DELETE FROM logistics.locations WHERE location_id = @locationId;";
        await connection.ExecuteAsync(sql, new { locationId });
    }
}
