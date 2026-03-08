using System;

namespace Klarity.Api.Models.Marine
{
    public class VoyageSchedule
    {
        public string? ScheduleId { get; set; }
        public string VesselId { get; set; } = string.Empty;
        public string OriginId { get; set; } = string.Empty;
        public string DestinationId { get; set; } = string.Empty;
        public TimeSpan DepartureTime { get; set; }
        public int DurationDays { get; set; }
        public string Frequency { get; set; } = "Weekly";
        public string? DaysOfWeek { get; set; } 
        public int? DayOfMonth { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
        public string? VesselName { get; set; }
        public string? OriginName { get; set; }
        public string? DestinationName { get; set; }
    }
}
