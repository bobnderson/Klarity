using System.Data;
using Microsoft.Data.SqlClient;

namespace Klarity.Api.Data;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}

public class DbConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public DbConnectionFactory(string connectionString, Utils.Security security)
    {
        // Try to decrypt. If it's already plain text, encryption logic might fail or return trash, 
        // but Diced pattern assumes it IS encrypted in appsettings.
        try 
        {
            _connectionString = security.Decrypt(connectionString);
        }
        catch 
        {
            _connectionString = connectionString; // Fallback if not encrypted
        }
    }

    public IDbConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }
}
