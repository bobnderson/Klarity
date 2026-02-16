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
        
        // Add JWT Authentication to Swagger
        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter your JWT token in the text box below. Example: 'your-token-here'"
        });

        options.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
    });

    // Register IDbConnectionFactory
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
    builder.Services.AddSingleton<IDbConnectionFactory>(new DbConnectionFactory(connectionString));
    
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

    // Configure Authentication
    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddNegotiate() // Windows Authentication
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "KlarityApi",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "KlarityClient",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "SecretKeyForKlarityAppAuth2025!Fix")),
            ClockSkew = TimeSpan.Zero
        };
    });

    builder.Services.AddAuthorization();

    var app = builder.Build();

    // Configure the HTTP request pipeline.
    app.UseSerilogRequestLogging();
    app.UseSwagger();
    app.UseSwaggerUI();

    app.UseRouting();
    app.UseCors("AllowFrontend");

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    // Apply migrations
    try
    {
        using (var scope = app.Services.CreateScope())
        {
            var dbFactory = scope.ServiceProvider.GetRequiredService<IDbConnectionFactory>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            
            var migrationsDir = Path.Combine(app.Environment.ContentRootPath, "Data", "Migrations");
            if (Directory.Exists(migrationsDir))
            {
                var migrationFiles = Directory.GetFiles(migrationsDir, "*.sql").OrderBy(f => f);
                foreach (var migrationFile in migrationFiles)
                {
                    logger.LogInformation("Checking migration: {MigrationFile}", Path.GetFileName(migrationFile));
                    var sql = File.ReadAllText(migrationFile);
                    
                    // SQL Server batch separator 'GO' should be on its own line
                    var commands = System.Text.RegularExpressions.Regex.Split(sql, @"^\s*GO\s*$", System.Text.RegularExpressions.RegexOptions.Multiline | System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                    
                    using (var connection = dbFactory.CreateConnection())
                    {
                        connection.Open();
                        foreach (var cmd in commands)
                        {
                            if (string.IsNullOrWhiteSpace(cmd)) continue;
                            try {
                                connection.Execute(cmd);
                            } catch (Exception ex) {
                                logger.LogWarning("Error executing command in {MigrationFile}: {Error}", Path.GetFileName(migrationFile), ex.Message);
                            }
                        }
                    }
                    logger.LogInformation("Migration {MigrationFile} processed.", Path.GetFileName(migrationFile));
                }
            }
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Failed to apply migrations on startup");
    }

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
