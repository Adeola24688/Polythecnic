using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using System.Net;
using StudentPortalAPI.Data;
using StudentPortalAPI.Services;

var builder = WebApplication.CreateBuilder(args);

var platformPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(platformPort))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{platformPort}");
}

// ─── Services ───
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// PostgreSQL + EF Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? BuildPostgresConnectionString(builder.Configuration["DATABASE_URL"])
    ?? throw new InvalidOperationException("Database connection is not configured. Set ConnectionStrings__DefaultConnection or DATABASE_URL.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Auth + external services
builder.Services.AddHttpClient();
builder.Services.AddScoped<SupabaseStorageService>();
builder.Services.AddScoped<AuthService>();

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT key is not configured. Set Jwt__Key in the environment.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "StudentPortalAPI",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "StudentPortalApp",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? Array.Empty<string>();
allowedOrigins = allowedOrigins
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .ToArray();

if (allowedOrigins.Length == 0)
{
    allowedOrigins = new[]
    {
        "http://localhost:4200",
        "http://localhost:4300",
        "https://polytechnicport.netlify.app",
        "https://student-portal-api-y3dn.onrender.com"
    };
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter 'Bearer' followed by a space and your token. Example: Bearer eyJhbGc..."
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();
app.Logger.LogInformation("Allowed CORS origins: {Origins}", string.Join(", ", allowedOrigins));

// ─── Middleware Pipeline ───
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAngular");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/", () => Results.Ok(new
{
    name = "StudentPortalAPI",
    status = "Running",
    swagger = app.Environment.IsDevelopment() ? "/swagger" : null
}));
app.MapGet("/health/live", () => Results.Ok(new { status = "Live" }));
app.MapGet("/health", async (AppDbContext db) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        return canConnect
            ? Results.Ok(new { status = "Healthy", database = "Connected" })
            : Results.Json(new { status = "Unhealthy", database = "Unavailable" }, statusCode: StatusCodes.Status503ServiceUnavailable);
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Database health check failed.");
        return Results.Json(new { status = "Unhealthy", database = "Unavailable" }, statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});
app.MapControllers();

// Auto-migrate database on startup
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    app.Logger.LogInformation("Database migrations applied successfully.");
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Database migration failed during startup. The API will keep running, but database-backed endpoints may fail until the database is reachable.");
}

app.Run();

static string? BuildPostgresConnectionString(string? databaseUrl)
{
    if (string.IsNullOrWhiteSpace(databaseUrl))
    {
        return null;
    }

    if (!databaseUrl.Contains("://", StringComparison.Ordinal))
    {
        return databaseUrl;
    }

    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':', 2, StringSplitOptions.None);

    var connectionStringBuilder = new NpgsqlConnectionStringBuilder
    {
        Host = ResolveIPv4Host(uri.Host),
        Port = uri.Port > 0 ? uri.Port : 5432,
        Database = uri.AbsolutePath.Trim('/'),
        Username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : string.Empty,
        Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
        SslMode = SslMode.Require
    };

    foreach (var parameter in uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
    {
        var parts = parameter.Split('=', 2, StringSplitOptions.None);
        var key = Uri.UnescapeDataString(parts[0]);
        var value = parts.Length > 1 ? Uri.UnescapeDataString(parts[1]) : string.Empty;

        try
        {
            connectionStringBuilder[key] = value;
        }
        catch (ArgumentException)
        {
        }
    }

    return connectionStringBuilder.ConnectionString;
}

static string ResolveIPv4Host(string host)
{
    try
    {
        var addresses = Dns.GetHostAddresses(host);
        var ipv4Address = addresses.FirstOrDefault(a => a.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);
        if (ipv4Address != null)
        {
            Console.WriteLine($"[DNS] Resolved {host} to IPv4: {ipv4Address}");
            return ipv4Address.ToString();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DNS Warning] Failed to force IPv4 resolution for {host}: {ex.Message}");
    }
    return host;
}
