namespace StokMate.Api.Common;

/// <summary>
/// Catches all errors in the pipeline and converts them into plain-text (text/plain) responses.
/// Known error types receive their respective status codes; for unexpected errors, internal
/// details are not exposed to the client and the details are written only to the server log.
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var (statusCode, message) = Map(ex);

            if (statusCode == StatusCodes.Status500InternalServerError)
            {
                // Log unexpected errors with their full exception details on the server.
                _logger.LogError(
                    ex,
                    "Unexpected error: {Method} {Path}",
                    context.Request.Method,
                    context.Request.Path);
            }

            // If the response body has already started, the status code/body can no longer be changed.
            if (context.Response.HasStarted)
            {
                throw;
            }

            // Response.Clear() is intentionally not called: it would remove headers added by the CORS
            // middleware and prevent the browser from delivering the error response to the client.
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "text/plain; charset=utf-8";
            context.Response.ContentLength = null;

            await context.Response.WriteAsync(message);
        }
    }

    /// <summary>Maps an exception type to an HTTP status code and a message shown to the client.</summary>
    private static (int StatusCode, string Message) Map(Exception ex) => ex switch
    {
        NotFoundException => (StatusCodes.Status404NotFound, ex.Message),
        ValidationException => (StatusCodes.Status400BadRequest, ex.Message),
        UnauthorizedException => (StatusCodes.Status401Unauthorized, ex.Message),
        ConflictException => (StatusCodes.Status409Conflict, ex.Message),
        _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred.")
    };
}