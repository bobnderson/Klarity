using System.Collections.Generic;

namespace Klarity.Api.Models
{
    public class PaginatedResponse<T>
    {
        public IEnumerable<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }
    }
}
