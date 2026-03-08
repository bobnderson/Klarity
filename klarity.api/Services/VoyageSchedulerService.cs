using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Klarity.Api.Data;
using Klarity.Api.Models;
using Klarity.Api.Models.Marine;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Klarity.Api.Services
{
    public class VoyageSchedulerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<VoyageSchedulerService> _logger;

        public VoyageSchedulerService(IServiceProvider serviceProvider, ILogger<VoyageSchedulerService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Voyage Scheduler Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessSchedules();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing voyage schedules.");
                }

                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }

            _logger.LogInformation("Voyage Scheduler Service is stopping.");
        }

        private async Task ProcessSchedules()
        {
            using var scope = _serviceProvider.CreateScope();
            var scheduleRepo = scope.ServiceProvider.GetRequiredService<IVoyageScheduleRepository>();
            var voyageRepo = scope.ServiceProvider.GetRequiredService<IVoyageRepository>();

            var schedules = await scheduleRepo.GetSchedulesAsync();
            var now = DateTime.Now;
            var horizon = now.AddDays(5);

            foreach (var schedule in schedules)
            {
                var nextOccurrences = GetOccurrencesInRange(schedule, now, horizon);
                foreach (var occurrence in nextOccurrences)
                {
                    var existingVoyages = await voyageRepo.GetVoyagesByVesselIdAsync(schedule.VesselId);
                    bool alreadyExists = existingVoyages.Any(v => 
                        Math.Abs((v.DepartureDateTime - occurrence.Departure).TotalMinutes) < 60);

                    if (!alreadyExists)
                    {
                        _logger.LogInformation("Creating voyage from schedule {ScheduleId} for {Departure}", schedule.ScheduleId, occurrence.Departure);
                        
                        var newVoyage = new Voyage
                        {
                            VesselId = schedule.VesselId,
                            OriginId = schedule.OriginId,
                            DestinationId = schedule.DestinationId,
                            DepartureDateTime = occurrence.Departure,
                            Eta = occurrence.Departure.AddDays(schedule.DurationDays),
                            StatusId = "scheduled",
                            ScheduleId = schedule.ScheduleId
                        };

                        await voyageRepo.CreateVoyageAsync(newVoyage);
                    }
                }
            }
        }

        private class Occurrence
        {
            public DateTime Departure { get; set; }
        }

        private IEnumerable<Occurrence> GetOccurrencesInRange(VoyageSchedule schedule, DateTime start, DateTime end)
        {
            var occurrences = new List<Occurrence>();
            var checkDate = start.Date;

            while (checkDate <= end.Date)
            {
                bool applies = false;
                if (schedule.Frequency == "Daily") applies = true;
                else if (schedule.Frequency == "Weekly")
                {
                    var dayName = checkDate.ToString("ddd");
                    if (schedule.DaysOfWeek?.Contains(dayName) == true) applies = true;
                }
                else if (schedule.Frequency == "Monthly")
                {
                    if (checkDate.Day == schedule.DayOfMonth) applies = true;
                }

                if (applies)
                {
                    var depDateTime = checkDate.Add(schedule.DepartureTime);
                    if (depDateTime >= start && depDateTime <= end)
                    {
                        occurrences.Add(new Occurrence { Departure = depDateTime });
                    }
                }
                checkDate = checkDate.AddDays(1);
            }

            return occurrences;
        }
    }
}
