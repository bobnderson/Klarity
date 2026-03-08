using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using Klarity.Api.Models.Marine;
using Microsoft.Extensions.Configuration;

namespace Klarity.Api.Data
{
    public interface IVoyageScheduleRepository
    {
        Task<IEnumerable<VoyageSchedule>> GetSchedulesAsync();
        Task<VoyageSchedule?> GetScheduleByIdAsync(string id);
        Task<string> CreateScheduleAsync(VoyageSchedule schedule);
        Task UpdateScheduleAsync(VoyageSchedule schedule);
        Task DeleteScheduleAsync(string id);
    }

    public class VoyageScheduleRepository : IVoyageScheduleRepository
    {
        private readonly IDbConnectionFactory _dbConnectionFactory;

        public VoyageScheduleRepository(IDbConnectionFactory dbConnectionFactory)
        {
            _dbConnectionFactory = dbConnectionFactory;
        }

        public async Task<IEnumerable<VoyageSchedule>> GetSchedulesAsync()
        {
            using var connection = _dbConnectionFactory.CreateConnection();
            const string sql = @"
                SELECT s.*, v.vessel_name as VesselName, 
                       lo.location_name as OriginName, 
                       ld.location_name as DestinationName
                FROM marine.voyage_schedules s
                LEFT JOIN marine.vessels v ON s.vessel_id = v.vessel_id
                LEFT JOIN logistics.locations lo ON s.origin_id = lo.location_id
                LEFT JOIN logistics.locations ld ON s.destination_id = ld.location_id
                WHERE s.is_active = 1";
            
            return await connection.QueryAsync<VoyageSchedule>(sql);
        }

        public async Task<VoyageSchedule?> GetScheduleByIdAsync(string id)
        {
            using var connection = _dbConnectionFactory.CreateConnection();
            const string sql = @"
                SELECT s.*, v.vessel_name as VesselName, 
                       lo.location_name as OriginName, 
                       ld.location_name as DestinationName
                FROM marine.voyage_schedules s
                LEFT JOIN marine.vessels v ON s.vessel_id = v.vessel_id
                LEFT JOIN logistics.locations lo ON s.origin_id = lo.location_id
                LEFT JOIN logistics.locations ld ON s.destination_id = ld.location_id
                WHERE s.schedule_id = @id";
            
            return await connection.QueryFirstOrDefaultAsync<VoyageSchedule>(sql, new { id });
        }

        public async Task<string> CreateScheduleAsync(VoyageSchedule schedule)
        {
            if (string.IsNullOrEmpty(schedule.ScheduleId))
                schedule.ScheduleId = $"VSCH-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

            using var connection = _dbConnectionFactory.CreateConnection();
            const string sql = @"
                INSERT INTO marine.voyage_schedules (
                    schedule_id, vessel_id, origin_id, destination_id, 
                    departure_time, duration_days, frequency, 
                    days_of_week, day_of_month, is_active
                ) VALUES (
                    @ScheduleId, @VesselId, @OriginId, @DestinationId, 
                    @DepartureTime, @DurationDays, @Frequency, 
                    @DaysOfWeek, @DayOfMonth, @IsActive
                )";
            
            await connection.ExecuteAsync(sql, schedule);
            return schedule.ScheduleId;
        }

        public async Task UpdateScheduleAsync(VoyageSchedule schedule)
        {
            using var connection = _dbConnectionFactory.CreateConnection();
            const string sql = @"
                UPDATE marine.voyage_schedules SET
                    vessel_id = @VesselId,
                    origin_id = @OriginId,
                    destination_id = @DestinationId,
                    departure_time = @DepartureTime,
                    duration_days = @DurationDays,
                    frequency = @Frequency,
                    days_of_week = @DaysOfWeek,
                    day_of_month = @DayOfMonth,
                    is_active = @IsActive,
                    updated_at = GETDATE()
                WHERE schedule_id = @ScheduleId";
            
            await connection.ExecuteAsync(sql, schedule);
        }

        public async Task DeleteScheduleAsync(string id)
        {
            using var connection = _dbConnectionFactory.CreateConnection();
            const string sql = "DELETE FROM marine.voyage_schedules WHERE schedule_id = @id";
            await connection.ExecuteAsync(sql, new { id });
        }
    }
}
