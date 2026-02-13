using Dapper;
using Klarity.Api.Data;
using Klarity.Api.Models;

namespace Klarity.Api.Services;

public interface IAuditService
{
    Task LogAsync(string accountName, string action, bool isSuccessful, string controller, string? requestBody = null, string? error = null);
}

public class AuditService : IAuditService
{
    private readonly IDbConnectionFactory _dbConnectionFactory;
    private readonly ILogger<AuditService> _logger;

    public AuditService(IDbConnectionFactory dbConnectionFactory, ILogger<AuditService> logger)
    {
        _dbConnectionFactory = dbConnectionFactory;
        _logger = logger;
    }

    public async Task LogAsync(string accountName, string action, bool isSuccessful, string controller, string? requestBody = null, string? error = null)
    {
        try
        {
            using var connection = _dbConnectionFactory.CreateConnection();
            const string sql = @"
                INSERT INTO auth.audit_logs (account_name, action, is_successful, request_body, controller, error, time_stamp)
                VALUES (@accountName, @action, @isSuccessful, @requestBody, @controller, @error, GETDATE());";

            await connection.ExecuteAsync(sql, new 
            { 
                accountName, 
                action, 
                isSuccessful, 
                requestBody, 
                controller, 
                error 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to write audit log for {AccountName}", accountName);
        }
    }
}
