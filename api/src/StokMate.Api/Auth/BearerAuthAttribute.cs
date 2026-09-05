using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace StokMate.Api.Auth;

/// <summary>
/// Validates the "Authorization: Bearer &lt;token&gt;" header. If the header is missing
/// or the token is invalid/expired, the action is never executed and a 401 response
/// with a plain-text body is returned.
/// The authenticated user's Id is stored in HttpContext.Items.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class BearerAuthAttribute : Attribute, IAuthorizationFilter
{
    private const string Scheme = "Bearer ";
    internal const string UserIdItemKey = "UserId";

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var header = context.HttpContext.Request.Headers.Authorization.ToString();

        if (string.IsNullOrWhiteSpace(header) || !header.StartsWith(Scheme, StringComparison.OrdinalIgnoreCase))
        {
            context.Result = PlainTextUnauthorized("Authorization header is missing or invalid.");
            return;
        }

        var token = header[Scheme.Length..].Trim();

        // TokenService is a singleton; resolve it from the request scope.
        var tokenService = context.HttpContext.RequestServices.GetRequiredService<TokenService>();
        var userId = tokenService.Validate(token);

        if (userId is null)
        {
            context.Result = PlainTextUnauthorized("Access token is invalid or expired.");
            return;
        }

        context.HttpContext.Items[UserIdItemKey] = userId.Value;
    }

    /// <summary>
    /// Since error responses use plain text, return a ContentResult instead of
    /// Unauthorized(). Unauthorized() would have no body and [ApiController]
    /// could convert the response to JSON.
    /// </summary>
    private static ContentResult PlainTextUnauthorized(string message) => new()
    {
        StatusCode = StatusCodes.Status401Unauthorized,
        ContentType = "text/plain; charset=utf-8",
        Content = message
    };
}

public static class BearerAuthExtensions
{
    /// <summary>Returns the Id of the user authenticated with [BearerAuth].</summary>
    public static int GetUserId(this HttpContext context)
        => (int)context.Items[BearerAuthAttribute.UserIdItemKey]!;
}