using Dapper;
using Klarity.Api.Models;

namespace Klarity.Api.Data;

public interface INotificationRepository
{
    Task<IEnumerable<NotificationTemplate>> GetTemplatesAsync();
    Task<NotificationTemplate?> GetTemplateByIdAsync(string templateId);
    Task UpdateTemplateAsync(NotificationTemplate template);
}

public class NotificationRepository : INotificationRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    public NotificationRepository(IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    public async Task<IEnumerable<NotificationTemplate>> GetTemplatesAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        return await connection.QueryAsync<NotificationTemplate>("SELECT * FROM master.notification_templates ORDER BY template_name");
    }

    public async Task<NotificationTemplate?> GetTemplateByIdAsync(string templateId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<NotificationTemplate>(
            "SELECT * FROM master.notification_templates WHERE template_id = @templateId", 
            new { templateId });
    }

    public async Task UpdateTemplateAsync(NotificationTemplate template)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            UPDATE master.notification_templates 
            SET subject = @Subject, 
                body_html = @BodyHtml, 
                updated_at = GETDATE()
            WHERE template_id = @TemplateId";
            
        await connection.ExecuteAsync(sql, template);
    }
}
