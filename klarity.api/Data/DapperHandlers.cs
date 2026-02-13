using Dapper;
using System.Data;

namespace Klarity.Api.Data;

public class StringListHandler : SqlMapper.TypeHandler<List<string>?>
{
    public override void SetValue(IDbDataParameter parameter, List<string>? value)
    {
        parameter.Value = value == null ? DBNull.Value : string.Join(",", value);
    }

    public override List<string>? Parse(object value)
    {
        if (value == null || value == DBNull.Value)
            return null;

        var str = value.ToString();
        if (string.IsNullOrWhiteSpace(str))
            return new List<string>();

        return str.Split(',', StringSplitOptions.RemoveEmptyEntries)
                  .Select(s => s.Trim())
                  .ToList();
    }
}
