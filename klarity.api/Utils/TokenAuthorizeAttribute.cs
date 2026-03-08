using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Klarity.Api.Utils;

namespace Klarity.Api.Utils
{
    public class TokenAuthorizeAttribute : Attribute, IAuthorizationFilter
    {
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            if (context.HttpContext.Request.Method == HttpMethods.Options)
            {
                return;
            }

            var security = context.HttpContext.RequestServices.GetService<Security>();
            if (security == null)
            {
                Console.WriteLine("Authorize: Security utility not found in services.");
                context.Result = new UnauthorizedResult();
                return;
            }

            bool isTokenValid = security.EvaluateToken<System.Text.Json.JsonDocument>(context.HttpContext.Request, out var userData);

            if (!isTokenValid)
            {
                Console.WriteLine($"Authorize: Invalid or missing token for {context.HttpContext.Request.Path}");
                context.Result = new UnauthorizedResult();
            }
        }
    }
}
