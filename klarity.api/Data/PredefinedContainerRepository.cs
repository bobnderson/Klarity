using Dapper;
using Klarity.Api.Models;

namespace Klarity.Api.Data;

    public interface IPredefinedContainerRepository
    {
        Task<IEnumerable<PredefinedContainer>> GetContainersAsync();
        Task<PredefinedContainer?> GetContainerByIdAsync(string containerId);
        Task<string> CreateContainerAsync(PredefinedContainer container);
        Task<bool> UpdateContainerAsync(PredefinedContainer container);
        Task<bool> DeleteContainerAsync(string containerId);
    }

public class PredefinedContainerRepository : IPredefinedContainerRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    public PredefinedContainerRepository(IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    public async Task<IEnumerable<PredefinedContainer>> GetContainersAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                container_id as ContainerId, vessel_id as VesselId, name as Name, description as Description,
                length as Length, width as Width, height as Height, dimension_unit as DimensionUnit, 
                max_weight as MaxWeight, weight_unit as WeightUnit, 
                created_at as CreatedAt, updated_at as UpdatedAt, 
                created_by as CreatedBy, is_deleted as IsDeleted, is_active as IsActive
            FROM logistics.predefined_containers
            WHERE is_deleted = 0 AND is_active = 1
            ORDER BY name ASC;";
            
        return await connection.QueryAsync<PredefinedContainer>(sql);
    }

    public async Task<PredefinedContainer?> GetContainerByIdAsync(string containerId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                container_id as ContainerId, vessel_id as VesselId, name as Name, description as Description,
                length as Length, width as Width, height as Height, dimension_unit as DimensionUnit, 
                max_weight as MaxWeight, weight_unit as WeightUnit, 
                created_at as CreatedAt, updated_at as UpdatedAt, 
                created_by as CreatedBy, is_deleted as IsDeleted, is_active as IsActive
            FROM logistics.predefined_containers
            WHERE container_id = @ContainerId AND is_deleted = 0;";
            
        return await connection.QueryFirstOrDefaultAsync<PredefinedContainer>(sql, new { ContainerId = containerId });
    }

    public async Task<string> CreateContainerAsync(PredefinedContainer container)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            INSERT INTO logistics.predefined_containers (
                container_id, vessel_id, name, description, length, width, height, dimension_unit, 
                max_weight, weight_unit, created_at, updated_at, created_by, is_active, is_deleted
            ) VALUES (
                @ContainerId, @VesselId, @Name, @Description, @Length, @Width, @Height, @DimensionUnit, 
                @MaxWeight, @WeightUnit, GETUTCDATE(), GETUTCDATE(), @CreatedBy, @IsActive, 0
            );";
            
        await connection.ExecuteAsync(sql, container);

        return container.ContainerId;
    }

    public async Task<bool> UpdateContainerAsync(PredefinedContainer container)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            UPDATE logistics.predefined_containers SET
                vessel_id = @VesselId, name = @Name, description = @Description, length = @Length, width = @Width, height = @Height, 
                dimension_unit = @DimensionUnit, max_weight = @MaxWeight, 
                weight_unit = @WeightUnit, updated_at = GETUTCDATE(), is_active = @IsActive
            WHERE container_id = @ContainerId AND is_deleted = 0;";
            
        var rowsAffected = await connection.ExecuteAsync(sql, container);
        
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteContainerAsync(string containerId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            UPDATE logistics.predefined_containers
            SET is_deleted = 1, updated_at = GETUTCDATE()
            WHERE container_id = @ContainerId;";
            
        var rowsAffected = await connection.ExecuteAsync(sql, new { ContainerId = containerId });
        return rowsAffected > 0;
    }
}
