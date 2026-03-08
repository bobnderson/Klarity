using Dapper;
using Klarity.Api.Data;
using Klarity.Api.Models;

namespace Klarity.Api.Data;

public interface IAdminRepository
{
    // User CRUD
    Task<IEnumerable<User>> GetUsersAsync();
    Task<User?> GetUserByIdAsync(string accountId);
    Task CreateUserAsync(User user);
    Task UpdateUserAsync(User user);
    Task UpdatePasswordHashAsync(string accountId, string passwordHash);
    Task DeleteUserAsync(string accountId);

    // Role CRUD
    Task<IEnumerable<Role>> GetRolesAsync();
    Task<Role?> GetRoleByIdAsync(string roleId);
    Task CreateRoleAsync(Role role);
    Task UpdateRoleAsync(Role role);
    Task DeleteRoleAsync(string roleId);
    Task<IEnumerable<MenuItemOptionDto>> GetMenuItemOptionsAsync();
}

public class AdminRepository : IAdminRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;

    public AdminRepository(IDbConnectionFactory dbConnectionFactory)
    {
        _dbConnectionFactory = dbConnectionFactory;
    }

    // --- User CRUD ---

    public async Task<IEnumerable<User>> GetUsersAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT account_id, account_name, email, last_login, is_active, is_external, password_hash, must_change_password 
            FROM auth.users;
            
            SELECT account_id AS AccountId, role_id AS RoleId 
            FROM auth.user_roles;";

        using var multi = await connection.QueryMultipleAsync(sql);
        var users = (await multi.ReadAsync<User>()).ToList();
        var allUserRoles = await multi.ReadAsync<dynamic>();

        foreach (var user in users)
        {
            user.RoleIds = allUserRoles
                .Where(ur => ur.AccountId == user.AccountId)
                .Select(ur => (string)ur.RoleId)
                .ToList();
        }

        return users;
    }

    public async Task<User?> GetUserByIdAsync(string accountId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT account_id, account_name, email, last_login, is_active, is_external, password_hash, must_change_password 
            FROM auth.users WHERE account_id = @accountId;

            SELECT role_id FROM auth.user_roles WHERE account_id = @accountId;";

        using var multi = await connection.QueryMultipleAsync(sql, new { accountId });
        var user = await multi.ReadFirstOrDefaultAsync<User>();
        if (user != null)
        {
            user.RoleIds = (await multi.ReadAsync<string>()).ToList();
        }
        return user;
    }

    public async Task CreateUserAsync(User user)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        try
        {
            const string userSql = @"
                INSERT INTO auth.users (account_id, account_name, email, is_active, is_external, password_hash, must_change_password) 
                VALUES (@AccountId, @AccountName, @Email, @IsActive, @IsExternal, @PasswordHash, @MustChangePassword);";
            await connection.ExecuteAsync(userSql, user, transaction);

            if (user.RoleIds.Any())
            {
                const string roleSql = "INSERT INTO auth.user_roles (user_role_id, account_id, role_id) VALUES (newid(), @AccountId, @RoleId);";
                await connection.ExecuteAsync(roleSql, user.RoleIds.Select(r => new { user.AccountId, RoleId = r }), transaction);
            }

            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task UpdateUserAsync(User user)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        try
        {
            const string userSql = @"
                UPDATE auth.users 
                SET account_name = @AccountName, email = @Email, is_active = @IsActive, is_external = @IsExternal, 
                    password_hash = @PasswordHash, must_change_password = @MustChangePassword 
                WHERE account_id = @AccountId;";
            await connection.ExecuteAsync(userSql, user, transaction);

            await connection.ExecuteAsync("DELETE FROM auth.user_roles WHERE account_id = @AccountId;", new { user.AccountId }, transaction);

            if (user.RoleIds.Any())
            {
                const string roleSql = "INSERT INTO auth.user_roles (user_role_id, account_id, role_id) VALUES (newid(), @AccountId, @RoleId);";
                await connection.ExecuteAsync(roleSql, user.RoleIds.Select(r => new { user.AccountId, RoleId = r }), transaction);
            }

            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task UpdatePasswordHashAsync(string accountId, string passwordHash)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "UPDATE auth.users SET password_hash = @passwordHash, must_change_password = 0 WHERE account_id = @accountId;";
        await connection.ExecuteAsync(sql, new { accountId, passwordHash });
    }

    public async Task DeleteUserAsync(string accountId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        try
        {
            await connection.ExecuteAsync("DELETE FROM auth.user_roles WHERE account_id = @accountId;", new { accountId }, transaction);
            await connection.ExecuteAsync("DELETE FROM auth.users WHERE account_id = @accountId;", new { accountId }, transaction);
            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    // --- Role CRUD ---

    public async Task<IEnumerable<Role>> GetRolesAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT role_id, role_name, description, is_active FROM auth.roles;
            SELECT role_id AS RoleId, menu_item_id AS MenuItemId FROM auth.role_menu_access;";

        using var multi = await connection.QueryMultipleAsync(sql);
        var roles = (await multi.ReadAsync<Role>()).ToList();
        var allRoleMenus = await multi.ReadAsync<dynamic>();

        foreach (var role in roles)
        {
            role.MenuItemIds = allRoleMenus
                .Where(rm => rm.RoleId == role.RoleId)
                .Select(rm => (string)rm.MenuItemId)
                .ToList();
        }

        return roles;
    }

    public async Task<Role?> GetRoleByIdAsync(string roleId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT role_id, role_name, description, is_active FROM auth.roles WHERE role_id = @roleId;
            SELECT menu_item_id FROM auth.role_menu_access WHERE role_id = @roleId;";

        using var multi = await connection.QueryMultipleAsync(sql, new { roleId });
        var role = await multi.ReadFirstOrDefaultAsync<Role>();
        if (role != null)
        {
            role.MenuItemIds = (await multi.ReadAsync<string>()).ToList();
        }
        return role;
    }

    public async Task CreateRoleAsync(Role role)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        try
        {
            const string sql = "INSERT INTO auth.roles (role_id, role_name, description, is_active) VALUES (@RoleId, @RoleName, @Description, @IsActive);";
            await connection.ExecuteAsync(sql, role, transaction);

            if (role.MenuItemIds.Any())
            {
                const string menuSql = "INSERT INTO auth.role_menu_access (role_menu_access_id, role_id, menu_item_id) VALUES (newid(), @RoleId, @MenuItemId);";
                await connection.ExecuteAsync(menuSql, role.MenuItemIds.Select(mId => new { role.RoleId, MenuItemId = mId }), transaction);
            }

            transaction.Commit();
        }
        catch (Exception)
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task UpdateRoleAsync(Role role)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        try
        {
            const string sql = "UPDATE auth.roles SET role_name = @RoleName, description = @Description, is_active = @IsActive WHERE role_id = @RoleId;";
            await connection.ExecuteAsync(sql, role, transaction);

            await connection.ExecuteAsync("DELETE FROM auth.role_menu_access WHERE role_id = @RoleId;", new { role.RoleId }, transaction);

            if (role.MenuItemIds.Any())
            {
                const string menuSql = "INSERT INTO auth.role_menu_access (role_menu_access_id, role_id, menu_item_id) VALUES (newid(), @RoleId, @MenuItemId);";
                await connection.ExecuteAsync(menuSql, role.MenuItemIds.Select(mId => new { role.RoleId, MenuItemId = mId }), transaction);
            }

            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task DeleteRoleAsync(string roleId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        try
        {
            await connection.ExecuteAsync("DELETE FROM auth.role_menu_access WHERE role_id = @roleId;", new { roleId }, transaction);
            await connection.ExecuteAsync("DELETE FROM auth.user_roles WHERE role_id = @roleId;", new { roleId }, transaction);
            await connection.ExecuteAsync("DELETE FROM auth.roles WHERE role_id = @roleId;", new { roleId }, transaction);
            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<IEnumerable<MenuItemOptionDto>> GetMenuItemOptionsAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                mi.menu_item_id AS MenuItemId, 
                mi.label AS ItemLabel, 
                mg.label AS GroupLabel 
            FROM auth.menu_items mi
            JOIN auth.menu_groups mg ON mi.menu_group_id = mg.menu_group_id
            ORDER BY mg.display_order, mi.display_order;";
        return await connection.QueryAsync<MenuItemOptionDto>(sql);
    }
}
