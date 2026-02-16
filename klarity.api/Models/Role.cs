using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Klarity.Api.Models;

public class Role
{
    public string RoleId { get; set; } = string.Empty;

    [Required(ErrorMessage = "RoleName is required")]
    public string RoleName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required")]
    public string? Description { get; set; }

    [MinLength(1, ErrorMessage = "At least one menu item must be selected")]
    public List<string> MenuItemIds { get; set; } = new();

    public bool IsActive { get; set; } = true;
}

public class MenuItemOptionDto
{
    public string MenuItemId { get; set; } = string.Empty;
    public string ItemLabel { get; set; } = string.Empty;
    public string GroupLabel { get; set; } = string.Empty;
}

public class CreateRoleDto
{
    [JsonIgnore]
    public string RoleId { get; set; } = string.Empty;
    [Required(ErrorMessage = "RoleName is required")]
    public string RoleName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required")]
    public string? Description { get; set; }

    [MinLength(1, ErrorMessage = "At least one menu item must be selected")]
    public List<string> MenuItemIds { get; set; } = new();

    public bool IsActive { get; set; } = true;
}