using Dapper;
using System.Reflection;

namespace Klarity.Api.Data;

public static class DapperTypeMapper
{
    public static void Initialize()
    {
        var assembly = Assembly.GetExecutingAssembly();

        // Register mappings for all entities
        SetUnderscoreMappingForAllEntities(assembly);

        // Register mappings for nested types
        RegisterNestedTypeMappings(assembly);
    }

    private static void SetUnderscoreMappingForAllEntities(Assembly assembly)
    {
        var entityTypes = assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && (t.Namespace?.StartsWith("Klarity.Api.Models") ?? false));

        foreach (var type in entityTypes)
        {
            SqlMapper.SetTypeMap(
                type,
                new CustomPropertyTypeMap(
                    type,
                    (t, columnName) =>
                        t.GetProperties().FirstOrDefault(prop =>
                            string.Equals(
                                prop.Name,
                                columnName.Replace("_", ""),
                                StringComparison.OrdinalIgnoreCase))
                )
            );
        }
    }

    private static void RegisterNestedTypeMappings(Assembly assembly)
    {
        // Get all types that might contain nested objects
        var parentTypes = assembly.GetTypes()
            .Where(t => t.IsClass &&
                       !t.IsAbstract &&
                       (t.Namespace?.StartsWith("Klarity.Api.Models") ?? false) &&
                       t.GetProperties().Any(p => p.PropertyType.IsClass &&
                                                p.PropertyType != typeof(string)));

        foreach (var parentType in parentTypes)
        {
            var nestedProperties = parentType.GetProperties()
                .Where(p => p.PropertyType.IsClass && p.PropertyType != typeof(string));

            foreach (var nestedProp in nestedProperties)
            {
                // Register mapping for the nested type if not already registered
                if (SqlMapper.GetTypeMap(nestedProp.PropertyType) == null)
                {
                    SqlMapper.SetTypeMap(
                        nestedProp.PropertyType,
                        new CustomPropertyTypeMap(
                            nestedProp.PropertyType,
                            (t, columnName) =>
                                t.GetProperties().FirstOrDefault(prop =>
                                    string.Equals(
                                        prop.Name,
                                        columnName.Replace("_", ""),
                                        StringComparison.OrdinalIgnoreCase))
                        )
                    );
                }
            }
        }
    }
}
