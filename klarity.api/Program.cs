using System.Data;
using System.Text;
using Dapper;
using Klarity.Api.Data;
using Klarity.Api.Services;
using Klarity.Api.Services.Optimization;
using Klarity.Api.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

// Configuration for Serilog early on
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("Logs/early-logs-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

// Configure Dapper to support snake_case database columns mapping to PascalCase properties
Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;

// Register custom Dapper TypeHandlers
Dapper.SqlMapper.AddTypeHandler(new Klarity.Api.Data.StringListHandler());

// Initialize automated Dapper mapping via reflection
Klarity.Api.Data.DapperTypeMapper.Initialize();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // Full Serilog configuration from appsettings
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext());

    // Add services to the container.
    builder.Services.AddControllers();
    builder.Services.AddScoped<IVoyageOptimizerService, VoyageOptimizerService>();
builder.Services.AddMemoryCache();
    
    // Configure CORS
    builder.Services.AddCors(options =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    });

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo { Title = "Klarity API", Version = "v1" });
        
        // Use X-Auth-Token to avoid collision with IIS Windows Auth headers
        options.AddSecurityDefinition("X-Auth-Token", new OpenApiSecurityScheme
        {
            Name = "X-Auth-Token",
            Type = SecuritySchemeType.ApiKey,
            In = ParameterLocation.Header,
            Description = "Enter the encrypted token from the login response."
        });

        options.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "X-Auth-Token" }
                },
                Array.Empty<string>()
            }
        });
    });

    // Register Security Utility
    builder.Services.AddSingleton<Klarity.Api.Utils.Security>();

    // Register IDbConnectionFactory
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (string.IsNullOrEmpty(connectionString))
    {
        throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
    }
    
    // We pass the singleton Security instance to the factory
    builder.Services.AddSingleton<IDbConnectionFactory>(sp => 
        new DbConnectionFactory(connectionString, sp.GetRequiredService<Klarity.Api.Utils.Security>()));
    
    builder.Services.AddScoped<Klarity.Api.Services.IAuditService, Klarity.Api.Services.AuditService>();
    builder.Services.AddScoped<Klarity.Api.Data.IAuthRepository, Klarity.Api.Data.AuthRepository>();
    builder.Services.AddScoped<Klarity.Api.Data.IAdminRepository, Klarity.Api.Data.AdminRepository>();
    builder.Services.AddScoped<Klarity.Api.Data.IVesselRepository, Klarity.Api.Data.VesselRepository>();
    builder.Services.AddScoped<Klarity.Api.Data.ILocationRepository, Klarity.Api.Data.LocationRepository>();
    builder.Services.AddScoped<Klarity.Api.Data.IMovementRequestRepository, Klarity.Api.Data.MovementRequestRepository>();
    builder.Services.AddScoped<Klarity.Api.Data.IVoyageRepository, Klarity.Api.Data.VoyageRepository>();
    builder.Services.AddScoped<Klarity.Api.Data.IFlightRepository, Klarity.Api.Data.FlightRepository>();
    builder.Services.AddScoped<Klarity.Api.Data.IHelicopterRepository, Klarity.Api.Data.HelicopterRepository>();
    builder.Services.AddScoped<Klarity.Api.Data.ISettingsRepository, Klarity.Api.Data.SettingsRepository>();
    builder.Services.AddScoped<Klarity.Api.Services.IActiveDirectoryService, Klarity.Api.Services.ActiveDirectoryService>();
builder.Services.AddScoped<Klarity.Api.Services.IEmailService, Klarity.Api.Services.EmailService>();
builder.Services.AddScoped<Klarity.Api.Services.IPdfService, Klarity.Api.Services.PdfService>();

    builder.Services.AddScoped<Klarity.Api.Data.IFlightScheduleRepository, Klarity.Api.Data.FlightScheduleRepository>();

    // builder.Services.AddAuthentication(); 

    // builder.Services.Configure<IISServerOptions>(options =>
    // {
    //     options.AutomaticAuthentication = true;
    // });

    // builder.Services.AddAuthorization();

    var app = builder.Build();

    // Configure the HTTP request pipeline.
    app.UseDefaultFiles();
    app.UseStaticFiles();
    app.UseSerilogRequestLogging();
    app.UseSwagger();
    app.UseSwaggerUI();

    app.UseRouting();
    app.UseCors("AllowFrontend");

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();
    app.MapFallbackToFile("index.html");

    // Health check / Test endpoints
    app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Timestamp = DateTime.UtcNow }));

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
