using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using StokMate.Api.Auth;
using StokMate.Api.Common;
using StokMate.Api.Data;
using StokMate.Api.Services;

const string corsPolicyName = "StokMateCors";

var builder = WebApplication.CreateBuilder(args);

// Fixed port: 5080. Listens on all network interfaces (0.0.0.0), allowing the API to be accessed
// from both localhost and emulators/physical devices using the machine's local IP address.
builder.WebHost.UseUrls("http://0.0.0.0:5080");

// In-memory database: requires no setup; data is lost when the application shuts down.
builder.Services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase("StokMate"));

// Access tokens are kept in process memory, so there should be only one instance.
builder.Services.AddSingleton<TokenService>();

// Services are registered as concrete classes without interfaces.
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<LookupService>();

builder.Services.AddControllers();

// Model binding errors are also returned as plain text. This must come AFTER AddControllers()
// so that it overrides the default ProblemDetails (JSON) producer.
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = _ => new ContentResult
    {
        StatusCode = StatusCodes.Status400BadRequest,
        ContentType = "text/plain; charset=utf-8",
        Content = "The request is invalid or contains missing fields."
    };
});

// CORS is fully open so that web and mobile clients can connect without issues.
builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy => policy
        .AllowAnyOrigin()
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "StokMate API",
        Version = "v1",
        Description = "Inventory management case study API. Price fields are expressed in KURUŞ (1999 = 19.99 TRY)."
    });

    // Opaque Bearer token definition for the "Authorize" button in the Swagger UI.
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        In = ParameterLocation.Header,
        Description = "Enter the accessToken value from the /auth/login response."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });

    // XML summary comments in controllers are displayed as descriptions in Swagger.
    var xmlPath = Path.Combine(AppContext.BaseDirectory, $"{Assembly.GetExecutingAssembly().GetName().Name}.xml");
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

var app = builder.Build();

// Sample data is loaded when the application starts.
using (var scope = app.Services.CreateScope())
{
    DbSeeder.Seed(scope.ServiceProvider.GetRequiredService<AppDbContext>());
}

// Outer layer: converts all errors below into plain-text responses.
app.UseMiddleware<ExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseRouting();
app.UseCors(corsPolicyName);
app.MapControllers();

app.Run();