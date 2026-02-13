namespace Klarity.Api.Utils;

public static class UnitConverter
{
    public const string DefaultWeightUnit = "tonnes";
    public const string MetricTonnesUnit = "MT";

    /// <summary>
    /// Converts weight value to Metric Tonnes.
    /// </summary>
    public static double ToMetricTonnes(double value, string? unit)
    {
        if (string.IsNullOrEmpty(unit))
        {
            return value; 
        }

        return unit.ToLower() switch
        {
            "tonnes" => value,
            "mt" => value,
            "kg" => value / 1000.0,
            "lbs" => value * 0.000453592,
            "units" => value, 
            _ => value
        };
    }

    /// <summary>
    /// Parses dimensions (LxWxH) and returns calculated area in square meters (m2).
    /// </summary>
    public static double ToSquareMeters(string? dimensions, string? unit)
    {
        if (string.IsNullOrEmpty(dimensions)) return 0;

        var parts = dimensions.ToLower()
            .Replace("m", "")
            .Split(new[] { 'x', '*', 'X' }, StringSplitOptions.RemoveEmptyEntries);

        if (parts.Length < 2) return 0;

        if (double.TryParse(parts[0].Trim(), out double length) &&
            double.TryParse(parts[1].Trim(), out double width))
        {
            double area = length * width;
            return ConvertAreaToSquareMeters(area, unit);
        }

        return 0;
    }

    private static double ConvertAreaToSquareMeters(double area, string? unit)
    {
        if (string.IsNullOrEmpty(unit)) return area;

        // Note: Even if unit is m3/ft3, for deck area we care about the LxW conversion
        return unit.ToLower() switch
        {
            "m" => area,
            "m3" => area,
            "ft" => area * 0.092903,
            "ft3" => area * 0.092903,
            "cm3" => area * 0.0001,
            "in3" => area * 0.00064516,
            _ => area
        };
    }
}
