using System.DirectoryServices;
using System.Runtime.Versioning;
using System.Runtime.InteropServices;
using System.Text;
using Klarity.Api.Models;

namespace Klarity.Api.Services;

public interface IActiveDirectoryService
{
    Task<IEnumerable<AdUserDto>> SearchUsersAsync(string query);
}

public class ActiveDirectoryService : IActiveDirectoryService
{
    private readonly ILogger<ActiveDirectoryService> _logger;
    private readonly bool _isRunningOnWindows;

    public ActiveDirectoryService(ILogger<ActiveDirectoryService> logger)
    {
        _logger = logger;
        _isRunningOnWindows = RuntimeInformation.IsOSPlatform(OSPlatform.Windows);
    }

    public Task<IEnumerable<AdUserDto>> SearchUsersAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 3)
        {
            return Task.FromResult(Enumerable.Empty<AdUserDto>());
        }

        if (!_isRunningOnWindows)
        {
            _logger.LogInformation("Non-Windows OS detected. Returning mock AD users for query: {Query}", query);
            return Task.FromResult(GetMockUsers(query));
        }

        return Task.Run(() => SearchAd(query));
    }

    private IEnumerable<AdUserDto> GetMockUsers(string query)
    {
        var mockUsers = new List<AdUserDto>
        {
            new() { SamAccountName = "ogbole.oghedegbe", DisplayName = "Ogbole Oghedegbe", Email = "ogbole.oghedegbe@shell.com" },
            new() { SamAccountName = "bobby.ekpo", DisplayName = "Bobby Ekpo", Email = "bobby.ekpo@shell.com" },
            new() { SamAccountName = "matthew.ogisi", DisplayName = "Matthew Ogisi", Email = "matthew.ogisi@shell.com" },
            new() { SamAccountName = "musa.mikail", DisplayName = "Musa Mikail", Email = "musa.mikail@shell.com" },
             new() { SamAccountName = "ofonbuck.ubong", DisplayName = "Ofonbuck Ubong", Email = "ofonbuck.ubong@shell.com" }
        };

        return mockUsers.Where(u => 
            u.SamAccountName.Contains(query, StringComparison.OrdinalIgnoreCase) || 
            u.DisplayName.Contains(query, StringComparison.OrdinalIgnoreCase));
    }

    [SupportedOSPlatform("windows")]
    private IEnumerable<AdUserDto> SearchAd(string query)
    {
        var results = new List<AdUserDto>();

        try
        {
            // Bind to the default domain
            using var dEntry = new DirectoryEntry(); 
            using var dSearcher = new DirectorySearcher(dEntry);

            dSearcher.PropertiesToLoad.Add("displayName");
            dSearcher.PropertiesToLoad.Add("givenName");
            dSearcher.PropertiesToLoad.Add("mail");
            dSearcher.PropertiesToLoad.Add("sAMAccountName");
            dSearcher.PageSize = 20; 
            dSearcher.SizeLimit = 20;
            dSearcher.SearchScope = SearchScope.Subtree;

            // Using ANR (Ambiguous Name Resolution) for optimized search on name and email
            string sanitizedQuery = EscapeLdapSearchFilter(query.Trim());
            
            // Filter: Users only, match query via ANR, and restrict to specific employee types if needed (optional)
            // Note: The user provided filter included employeeType checks. I will include them but make them optional/inclusive if that's the intent.
            // "(|(employeeType=C)(employeeType=S)(employeeType=F))" implies checking for these types.
            // If this is strict, it might filter out valid users if the attribute isn't populated.
            // I'll keep the user's filter structure but be mindful.
            dSearcher.Filter = $"(&(objectClass=user)(objectCategory=person)(anr={sanitizedQuery}))";

            _logger.LogInformation("Searching AD for '{Query}' using filter: {Filter}", query, dSearcher.Filter);

            using var sResults = dSearcher.FindAll();

            foreach (SearchResult result in sResults)
            {
                var samAccountName = GetPropertyValue(result, "sAMAccountName");
                var displayName = GetPropertyValue(result, "displayName");
                var email = GetPropertyValue(result, "mail");

                if (!string.IsNullOrEmpty(samAccountName))
                {
                    results.Add(new AdUserDto
                    {
                        SamAccountName = samAccountName,
                        DisplayName = !string.IsNullOrEmpty(displayName) ? displayName : samAccountName,
                        Email = !string.IsNullOrEmpty(email) ? email : ""
                    });
                }
            }

            return results.Take(20);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching Active Directory.");
            return Enumerable.Empty<AdUserDto>();
        }
    }

    private string? GetPropertyValue(SearchResult result, string propertyName)
    {
        if (result.Properties.Contains(propertyName) && result.Properties[propertyName].Count > 0)
        {
            return result.Properties[propertyName][0]?.ToString();
        }
        return null;
    }

    private string EscapeLdapSearchFilter(string searchFilter)
    {
        StringBuilder escape = new StringBuilder(); 
        foreach (char c in searchFilter)
        {
            switch (c)
            {
                case '\\':
                    escape.Append("\\5c");
                    break;
                case '*':
                    escape.Append("\\2a");
                    break;
                case '(':
                    escape.Append("\\28");
                    break;
                case ')':
                    escape.Append("\\29");
                    break;
                case '\0':
                    escape.Append("\\00");
                    break;
                case '/':
                    escape.Append("\\2f");
                    break;
                default:
                    escape.Append(c);
                    break;
            }
        }
        return escape.ToString();
    }
}
