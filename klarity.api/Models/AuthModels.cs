using System.Text.Json.Serialization;

namespace Klarity.Api.Models;

public class LoginResponse
{
    public string AccountId { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public List<UserRoleConfig> Roles { get; set; } = new();
    public string LastLogin { get; set; } = string.Empty;
    public List<MenuItemConfig> Menus { get; set; } = new();
    public string Jwt { get; set; } = string.Empty;
}

public class UserRoleConfig
{
    public string RoleId { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
}

public class MenuItemConfig
{
    public string Label { get; set; } = string.Empty;
    public string? Path { get; set; }
    public List<MenuItemConfig>? Children { get; set; }
}
