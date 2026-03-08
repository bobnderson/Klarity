using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Klarity.Api.Services;

namespace Klarity.Api.Attributes;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, Inherited = true, AllowMultiple = false)]
public class AuditAttribute : Attribute, IAsyncActionFilter
{
    private readonly string _actionName;

    public AuditAttribute(string actionName)
    {
        _actionName = actionName;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executedContext = await next();

        var auditService = context.HttpContext.RequestServices.GetService<IAuditService>();
        if (auditService != null)
        {
            var controllerName = context.RouteData.Values["controller"]?.ToString() ?? "Unknown";

            // Determine if the action was successful
            bool isSuccessful = executedContext.Exception == null && 
                (executedContext.Result is IStatusCodeActionResult statusCodeResult ? 
                    (statusCodeResult.StatusCode >= 200 && statusCodeResult.StatusCode < 300) : true);

            string? error = executedContext.Exception?.Message;
            if (executedContext.Result is ObjectResult objResult && objResult.StatusCode >= 400)
            {
                isSuccessful = false;
                error ??= objResult.Value?.ToString();
            }
            
            string? requestBody = null;
            if (context.ActionArguments.Any())
            {
                var mainArgument = context.ActionArguments.Values.FirstOrDefault(v => v != null && !v.GetType().IsPrimitive && v.GetType() != typeof(string));
                if (mainArgument != null)
                {
                    try
                    {
                        requestBody = JsonSerializer.Serialize(mainArgument);
                    }
                    catch
                    {
                        
                    }
                }
            }

            string accountName = "Unknown"; // Set by AuditService internally if found in JWT
            
            await auditService.LogAsync(accountName, _actionName, isSuccessful, controllerName, requestBody, error);
        }
    }
}
