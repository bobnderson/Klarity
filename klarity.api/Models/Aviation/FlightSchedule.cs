using System;

namespace Klarity.Api.Models.Aviation
{
    public class FlightSchedule
    {
        public string? ScheduleId { get; set; }
        public string HelicopterId { get; set; } = string.Empty;
        public string OriginId { get; set; } = string.Empty;
        public string DestinationId { get; set; } = string.Empty;
        public TimeSpan DepartureTime { get; set; }
        public int DurationMinutes { get; set; }
        public string Frequency { get; set; } = "Daily";
        public string? DaysOfWeek { get; set; }
        public int? DayOfMonth { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        // Joined properties
        public string? HelicopterName { get; set; }
        public string? OriginName { get; set; }
        public string? DestinationName { get; set; }
    }
}
