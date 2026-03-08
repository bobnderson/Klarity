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
        try 
        {
            _connectionString = security.Decrypt(connectionString);
        }
        catch 
        {
            _connectionString = connectionString;
        }
    }

    public IDbConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }
}
