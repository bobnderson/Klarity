using Dapper;
using Klarity.Api.Models;

namespace Klarity.Api.Data;

public interface IVesselRepository
{
    Task<IEnumerable<Vessel>> GetVesselsAsync();
    Task<Vessel?> GetVesselByIdAsync(string vesselId);
    Task CreateVesselAsync(Vessel vessel);
    Task UpdateVesselAsync(Vessel vessel);
    Task DeleteVesselAsync(string vesselId);
    Task<IEnumerable<VesselCategory>> GetCategoriesAsync();
    Task<IEnumerable<VesselStatus>> GetVesselStatusesAsync();
}

public class VesselRepository : IVesselRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    public VesselRepository(IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    public async Task<IEnumerable<Vessel>> GetVesselsAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                v.vessel_id, v.vessel_name, v.owner, v.vessel_type_id, v.vessel_category_id, v.status_id,
                vt.type_name as vessel_type_name,
                1 as split_p, v.loa, v.lwl, v.breadth_moulded, v.depth_main_deck, v.design_draft,
                1 as split_c, v.fuel_oil, v.potable_water, v.drill_water, v.liquid_mud, v.dry_bulk_mud, v.dead_weight, v.deck_area, v.deck_loading, v.total_complement,
                1 as split_per, v.service_speed, v.max_speed,
                1 as split_f, v.hourly_operating_cost, v.fuel_consumption_rate, v.mobilisation_cost
            FROM marine.vessels v
            LEFT JOIN marine.vessel_category_types vt ON v.vessel_type_id = vt.category_type_id;";
        
        return await connection.QueryAsync<Vessel, VesselParticulars, VesselCapacities, VesselPerformance, VesselFinancials, Vessel>(
            sql,
            (vessel, particulars, capacities, performance, financials) =>
            {
                vessel.Particulars = particulars;
                vessel.Capacities = capacities;
                vessel.Performance = performance;
                vessel.Financials = financials;
                return vessel;
            },
            splitOn: "split_p,split_c,split_per,split_f");
    }

    public async Task<Vessel?> GetVesselByIdAsync(string vesselId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                v.vessel_id, v.vessel_name, v.owner, v.vessel_type_id, v.vessel_category_id, v.status_id,
                vt.type_name as vessel_type_name,
                1 as split_p, v.loa, v.lwl, v.breadth_moulded, v.depth_main_deck, v.design_draft,
                1 as split_c, v.fuel_oil, v.potable_water, v.drill_water, v.liquid_mud, v.dry_bulk_mud, v.dead_weight, v.deck_area, v.deck_loading, v.total_complement,
                1 as split_per, v.service_speed, v.max_speed,
                1 as split_f, v.hourly_operating_cost, v.fuel_consumption_rate, v.mobilisation_cost
            FROM marine.vessels v
            LEFT JOIN marine.vessel_category_types vt ON v.vessel_type_id = vt.category_type_id
            WHERE v.vessel_id = @vesselId;";
        
        var result = await connection.QueryAsync<Vessel, VesselParticulars, VesselCapacities, VesselPerformance, VesselFinancials, Vessel>(
            sql,
            (vessel, particulars, capacities, performance, financials) =>
            {
                vessel.Particulars = particulars;
                vessel.Capacities = capacities;
                vessel.Performance = performance;
                vessel.Financials = financials;
                return vessel;
            },
            new { vesselId },
            splitOn: "split_p,split_c,split_per,split_f");

        return result.FirstOrDefault();
    }

    public async Task CreateVesselAsync(Vessel vessel)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            INSERT INTO marine.vessels (
                vessel_id, vessel_name, owner, vessel_type_id, vessel_category_id, status_id,
                loa, lwl, breadth_moulded, depth_main_deck, design_draft,
                fuel_oil, potable_water, drill_water, liquid_mud, dry_bulk_mud, dead_weight, deck_area, deck_loading,
                service_speed, max_speed,
                hourly_operating_cost, fuel_consumption_rate, mobilisation_cost,
                total_complement
            ) VALUES (
                @VesselId, @VesselName, @Owner, @VesselTypeId, @VesselCategoryId, @StatusId,
                @Loa, @Lwl, @BreadthMoulded, @DepthMainDeck, @DesignDraft,
                @FuelOil, @PotableWater, @DrillWater, @LiquidMud, @DryBulkMud, @DeadWeight, @DeckArea, @DeckLoading,
                @ServiceSpeed, @MaxSpeed,
                @HourlyOperatingCost, @FuelConsumptionRate, @MobilisationCost,
                @TotalComplement
            );";
        
        await connection.ExecuteAsync(sql, new
        {
            vessel.VesselId,
            vessel.VesselName,
            vessel.Owner,
            vessel.VesselTypeId,
            vessel.VesselCategoryId,
            vessel.StatusId,
            vessel.Particulars.Loa,
            vessel.Particulars.Lwl,
            vessel.Particulars.BreadthMoulded,
            vessel.Particulars.DepthMainDeck,
            vessel.Particulars.DesignDraft,
            vessel.Capacities.FuelOil,
            vessel.Capacities.PotableWater,
            vessel.Capacities.DrillWater,
            vessel.Capacities.LiquidMud,
            vessel.Capacities.DryBulkMud,
            vessel.Capacities.DeadWeight,
            vessel.Capacities.DeckArea,
            vessel.Capacities.DeckLoading,
            vessel.Performance.ServiceSpeed,
            vessel.Performance.MaxSpeed,
            vessel.Financials.HourlyOperatingCost,
            vessel.Financials.FuelConsumptionRate,
            vessel.Financials.MobilisationCost,
            vessel.Capacities.TotalComplement
        });
    }

    public async Task UpdateVesselAsync(Vessel vessel)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            UPDATE marine.vessels SET
                vessel_name = @VesselName, owner = @Owner, 
                vessel_type_id = @VesselTypeId, vessel_category_id = @VesselCategoryId, 
                status_id = @StatusId,
                loa = @Loa, lwl = @Lwl, breadth_moulded = @BreadthMoulded, 
                depth_main_deck = @DepthMainDeck, design_draft = @DesignDraft,
                fuel_oil = @FuelOil, potable_water = @PotableWater, drill_water = @DrillWater, 
                liquid_mud = @LiquidMud, dry_bulk_mud = @DryBulkMud, dead_weight = @DeadWeight, 
                deck_area = @DeckArea, deck_loading = @DeckLoading,
                service_speed = @ServiceSpeed, max_speed = @MaxSpeed,
                hourly_operating_cost = @HourlyOperatingCost, 
                fuel_consumption_rate = @FuelConsumptionRate, 
                mobilisation_cost = @MobilisationCost,
                total_complement = @TotalComplement
            WHERE vessel_id = @VesselId;";
        
        await connection.ExecuteAsync(sql, new
        {
            vessel.VesselId,
            vessel.VesselName,
            vessel.Owner,
            vessel.VesselTypeId,
            vessel.VesselCategoryId,
            vessel.StatusId,
            vessel.Particulars.Loa,
            vessel.Particulars.Lwl,
            vessel.Particulars.BreadthMoulded,
            vessel.Particulars.DepthMainDeck,
            vessel.Particulars.DesignDraft,
            vessel.Capacities.FuelOil,
            vessel.Capacities.PotableWater,
            vessel.Capacities.DrillWater,
            vessel.Capacities.LiquidMud,
            vessel.Capacities.DryBulkMud,
            vessel.Capacities.DeadWeight,
            vessel.Capacities.DeckArea,
            vessel.Capacities.DeckLoading,
            vessel.Performance.ServiceSpeed,
            vessel.Performance.MaxSpeed,
            vessel.Financials.HourlyOperatingCost,
            vessel.Financials.FuelConsumptionRate,
            vessel.Financials.MobilisationCost,
            vessel.Capacities.TotalComplement
        });
    }

    public async Task DeleteVesselAsync(string vesselId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "DELETE FROM marine.vessels WHERE vessel_id = @vesselId;";
        await connection.ExecuteAsync(sql, new { vesselId });
    }

    public async Task<IEnumerable<VesselCategory>> GetCategoriesAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                hc.category_id, hc.category_name as category, 
                ht.category_type_id, ht.type_name as category_type
            FROM marine.vessel_categories hc
            LEFT JOIN marine.vessel_category_types ht ON hc.category_id = ht.category_id";

        var categoryDictionary = new Dictionary<string, VesselCategory>();

        var result = await connection.QueryAsync<VesselCategory, VesselCategoryType, VesselCategory>(
            sql,
            (category, type) =>
            {
                if (!categoryDictionary.TryGetValue(category.CategoryId, out var currentCategory))
                {
                    currentCategory = category;
                    currentCategory.Types = new List<VesselCategoryType>();
                    categoryDictionary.Add(currentCategory.CategoryId, currentCategory);
                }

                if (type != null)
                {
                    currentCategory.Types.Add(type);
                }

                return currentCategory;
            },
            splitOn: "category_type_id");

        return categoryDictionary.Values;
    }

    public async Task<IEnumerable<VesselStatus>> GetVesselStatusesAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "SELECT status_id, status_name as status FROM marine.vessel_statuses;";
        return await connection.QueryAsync<VesselStatus>(sql);
    }
}
