using Dapper;
using Klarity.Api.Data;

using Microsoft.Extensions.Caching.Memory;

namespace Klarity.Api.Data
{
    public class SmtpSettings
    {
        public bool Enabled { get; set; }
        public string Server { get; set; } = string.Empty;
        public int Port { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool EnableSsl { get; set; }
        public string SenderEmail { get; set; } = string.Empty;
        public string Domain { get; set; } = string.Empty; // For resolving samAccountName
    }

    public interface ISettingsRepository
    {
        Task<string?> GetSettingAsync(string key);
        Task SaveSettingAsync(string key, string value, string? updatedBy = null);
        Task<SmtpSettings> GetSmtpSettingsAsync();
        Task SaveSmtpSettingsAsync(SmtpSettings settings, string? updatedBy = null);
    }

    public class SettingsRepository : ISettingsRepository
    {
        private readonly IDbConnectionFactory _dbConnectionFactory;
        private readonly IMemoryCache _cache;
        private const string SmtpSettingsCacheKey = "SmtpSettings";

        public SettingsRepository(IDbConnectionFactory dbConnectionFactory, IMemoryCache cache)
        {
            _dbConnectionFactory = dbConnectionFactory;
            _cache = cache;
        }

        public async Task<string?> GetSettingAsync(string key)
        {
            using var connection = _dbConnectionFactory.CreateConnection();
            const string sql = "SELECT value FROM system.settings WHERE [key] = @key";
            return await connection.ExecuteScalarAsync<string>(sql, new { key });
        }

        public async Task SaveSettingAsync(string key, string value, string? updatedBy = null)
        {
            using var connection = _dbConnectionFactory.CreateConnection();
            const string sql = @"
                MERGE system.settings AS target
                USING (SELECT @key AS [key], @value AS value, @updatedBy AS updated_by) AS source
                ON (target.[key] = source.[key])
                WHEN MATCHED THEN
                    UPDATE SET value = source.value, updated_by = source.updated_by, updated_at = GETDATE()
                WHEN NOT MATCHED THEN
                    INSERT ([key], value, updated_by, updated_at)
                    VALUES (source.[key], source.value, source.updated_by, GETDATE());";
            
            await connection.ExecuteAsync(sql, new { key, value, updatedBy });
        }

        public async Task<SmtpSettings> GetSmtpSettingsAsync()
        {
            if (_cache.TryGetValue(SmtpSettingsCacheKey, out SmtpSettings? cachedSettings) && cachedSettings != null)
            {
                return cachedSettings;
            }

            using var connection = _dbConnectionFactory.CreateConnection();
            const string sql = "SELECT [key], value FROM system.settings WHERE [group] = 'SMTP'";
            var settings = await connection.QueryAsync<(string Key, string Value)>(sql);

            var dict = settings.ToDictionary(k => k.Key, v => v.Value);

             var smtpSettings = new SmtpSettings
            {
                Enabled = dict.TryGetValue("SMTP_Enabled", out var enabled) && bool.Parse(enabled),
                Server = dict.GetValueOrDefault("SMTP_Server", ""),
                Port = int.TryParse(dict.GetValueOrDefault("SMTP_Port", "2525"), out var port) ? port : 587,
                Username = dict.GetValueOrDefault("SMTP_Username", ""),
                Password = dict.GetValueOrDefault("SMTP_Password", ""),
                EnableSsl = dict.TryGetValue("SMTP_EnableSSL", out var ssl) && bool.Parse(ssl),
                SenderEmail = dict.GetValueOrDefault("SMTP_SenderEmail", ""),
                Domain = dict.GetValueOrDefault("SMTP_Domain", "")
            };

            var cacheOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromHours(1));

            _cache.Set(SmtpSettingsCacheKey, smtpSettings, cacheOptions);

            return smtpSettings;
        }

        public async Task SaveSmtpSettingsAsync(SmtpSettings settings, string? updatedBy = null)
        {
            using var connection = _dbConnectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            try 
            {
                var paramsList = new[]
                {
                    new { Key = "SMTP_Enabled", Value = settings.Enabled.ToString().ToLower(), Desc = "Enable or disable email notifications" },
                    new { Key = "SMTP_Server", Value = settings.Server, Desc = "SMTP Server Address" },
                    new { Key = "SMTP_Port", Value = settings.Port.ToString(), Desc = "SMTP Port" },
                    new { Key = "SMTP_Username", Value = settings.Username, Desc = "SMTP Username" },
                    new { Key = "SMTP_Password", Value = settings.Password, Desc = "SMTP Password" },
                    new { Key = "SMTP_EnableSSL", Value = settings.EnableSsl.ToString().ToLower(), Desc = "Enable SSL/TLS" },
                    new { Key = "SMTP_SenderEmail", Value = settings.SenderEmail, Desc = "Sender Email Address" },
                    new { Key = "SMTP_Domain", Value = settings.Domain, Desc = "Domain for resolving samAccountName" }
                };

                const string sql = @"
                    MERGE system.settings AS target
                    USING (SELECT @Key AS [key], @Value AS value, @Desc AS description, 'SMTP' AS [group], @UpdatedBy AS updated_by) AS source
                    ON (target.[key] = source.[key])
                    WHEN MATCHED THEN
                        UPDATE SET value = source.value, updated_by = source.updated_by, updated_at = GETDATE()
                    WHEN NOT MATCHED THEN
                        INSERT ([key], value, description, [group], updated_by, updated_at)
                        VALUES (source.[key], source.value, source.description, source.[group], source.updated_by, GETDATE());";

                await connection.ExecuteAsync(sql, paramsList.Select(p => new { p.Key, p.Value, p.Desc, UpdatedBy = updatedBy }), transaction);
                transaction.Commit();
                
                _cache.Remove(SmtpSettingsCacheKey);
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }
    }
}
