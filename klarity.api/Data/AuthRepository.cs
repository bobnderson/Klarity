using Dapper;
using Klarity.Api.Data;
using Klarity.Api.Models;

namespace Klarity.Api.Models
{
    public record LoginData(
        UserProfile? User,
        IEnumerable<UserRoleConfig> Roles,
        IEnumerable<dynamic> Menus
    );

    public class UserProfile
    {
        public string AccountId { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public DateTime? LastLogin { get; set; }
        public bool IsExternal { get; set; }
        public string? PasswordHash { get; set; }
        public bool MustChangePassword { get; set; }
    }
}

namespace Klarity.Api.Data
{
    using Klarity.Api.Models;

    public interface IAuthRepository
    {
        Task<LoginData> GetLoginDataAsync(string accountId);
        Task UpdateLastLoginAsync(string accountId);
    }

    public class AuthRepository : IAuthRepository
    {
        private readonly IDbConnectionFactory _dbConnectionFactory;

        public AuthRepository(IDbConnectionFactory dbConnectionFactory)
        {
            _dbConnectionFactory = dbConnectionFactory;
        }

        public async Task<LoginData> GetLoginDataAsync(string accountId)
        {
            using var connection = _dbConnectionFactory.CreateConnection();
            
            const string sql = @"
                -- 1. Fetch User Profile
                SELECT account_id, account_name, email, last_login, is_external, password_hash, must_change_password 
                FROM auth.users 
                WHERE account_id = @account_id AND is_active = 1;

                -- 2. Fetch User Roles
                SELECT r.role_id, r.role_name 
                FROM auth.user_roles ur 
                JOIN auth.roles r ON ur.role_id = r.role_id 
                WHERE ur.account_id = @account_id;

                -- 3. Fetch Menu Access
                WITH UserRoles AS (
                    SELECT DISTINCT role_id 
                    FROM auth.user_roles ur
                    WHERE account_id = @account_id
                )
                SELECT 
                    mg.label AS GroupLabel,
                    mi.label AS ItemLabel,
                    mi.path AS ItemPath	
                FROM UserRoles ur
                JOIN auth.role_menu_access rma ON ur.role_id = rma.role_id
                JOIN auth.menu_items mi ON rma.menu_item_id = mi.menu_item_id 
                JOIN auth.menu_groups mg ON mi.menu_group_id = mg.menu_group_id
                ORDER BY mg.display_order ASC;";

            using var multi = await connection.QueryMultipleAsync(sql, new { account_id = accountId });
            
            var user = await multi.ReadFirstOrDefaultAsync<UserProfile>();
            var roles = await multi.ReadAsync<UserRoleConfig>();
            var menus = await multi.ReadAsync<dynamic>();

            return new LoginData(user, roles, menus);
        }

        public async Task UpdateLastLoginAsync(string accountId)
        {
            using var connection = _dbConnectionFactory.CreateConnection();
            await connection.ExecuteAsync(
                "UPDATE auth.users SET last_login = GETDATE() WHERE account_id = @account_id", 
                new { account_id = accountId });
        }
    }
}
