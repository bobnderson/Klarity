using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using Klarity.Api.Models.Aviation;
using Microsoft.Extensions.Configuration;
using Microsoft.Data.SqlClient;

namespace Klarity.Api.Data
{
    public interface IFlightScheduleRepository
    {
        Task<IEnumerable<FlightSchedule>> GetSchedulesAsync();
        Task<FlightSchedule> GetScheduleByIdAsync(string id);
        Task<string> CreateScheduleAsync(FlightSchedule schedule);
        Task UpdateScheduleAsync(FlightSchedule schedule);
        Task DeleteScheduleAsync(string id);
    }

    public class FlightScheduleRepository : IFlightScheduleRepository
    {
        private readonly string _connectionString;

        public FlightScheduleRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<IEnumerable<FlightSchedule>> GetSchedulesAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                SELECT s.*, h.helicopter_name as HelicopterName, 
                       lo.location_name as OriginName, 
                       ld.location_name as DestinationName
                FROM aviation.flight_schedules s
                LEFT JOIN aviation.helicopters h ON s.helicopter_id = h.helicopter_id
                LEFT JOIN logistics.locations lo ON s.origin_id = lo.location_id
                LEFT JOIN logistics.locations ld ON s.destination_id = ld.location_id
                WHERE s.is_active = 1";
            
            return await connection.QueryAsync<FlightSchedule>(sql);
        }

        public async Task<FlightSchedule> GetScheduleByIdAsync(string id)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                SELECT s.*, h.helicopter_name as HelicopterName, 
                       lo.location_name as OriginName, 
                       ld.location_name as DestinationName
                FROM aviation.flight_schedules s
                LEFT JOIN aviation.helicopters h ON s.helicopter_id = h.helicopter_id
                LEFT JOIN logistics.locations lo ON s.origin_id = lo.location_id
                LEFT JOIN logistics.locations ld ON s.destination_id = ld.location_id
                WHERE s.schedule_id = @id";
            
            return await connection.QueryFirstOrDefaultAsync<FlightSchedule>(sql, new { id });
        }

        public async Task<string> CreateScheduleAsync(FlightSchedule schedule)
        {
            if (string.IsNullOrEmpty(schedule.ScheduleId))
                schedule.ScheduleId = $"SCH-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                INSERT INTO aviation.flight_schedules (
                    schedule_id, helicopter_id, origin_id, destination_id, 
                    departure_time, duration_minutes, frequency, 
                    days_of_week, day_of_month, is_active
                ) VALUES (
                    @ScheduleId, @HelicopterId, @OriginId, @DestinationId, 
                    @DepartureTime, @DurationMinutes, @Frequency, 
                    @DaysOfWeek, @DayOfMonth, @IsActive
                )";
            
            await connection.ExecuteAsync(sql, schedule);
            return schedule.ScheduleId;
        }

        public async Task UpdateScheduleAsync(FlightSchedule schedule)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                UPDATE aviation.flight_schedules SET
                    helicopter_id = @HelicopterId,
                    origin_id = @OriginId,
                    destination_id = @DestinationId,
                    departure_time = @DepartureTime,
                    duration_minutes = @DurationMinutes,
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
            using var connection = new SqlConnection(_connectionString);
            const string sql = "DELETE FROM aviation.flight_schedules WHERE schedule_id = @id";
            await connection.ExecuteAsync(sql, new { id });
        }
    }
}
