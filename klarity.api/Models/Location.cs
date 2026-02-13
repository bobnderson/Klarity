using System.ComponentModel.DataAnnotations;

namespace Klarity.Api.Models;

public class Location
{
    [Required]
    public string LocationId { get; set; } = string.Empty;
    
    [Required]
    public string LocationName { get; set; } = string.Empty;
    
    [Required]
    public string LocationType { get; set; } = string.Empty; // Platform or Port
    
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}
