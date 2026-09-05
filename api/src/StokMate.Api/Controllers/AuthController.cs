using Microsoft.AspNetCore.Mvc;
using StokMate.Api.Auth;
using StokMate.Api.Models;
using StokMate.Api.Services;

namespace StokMate.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    /// <summary>Logs in with an email and password and returns a token pair.</summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
        => await _authService.LoginAsync(request);

    /// <summary>Exchanges the refresh token for a new token pair.</summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshRequest request)
        => await _authService.RefreshAsync(request);

    /// <summary>Logs out and revokes the refresh token.</summary>
    [BearerAuth]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        await _authService.LogoutAsync(request.RefreshToken, HttpContext.GetUserId());
        return NoContent();
    }

    /// <summary>Returns the information of the authenticated user.</summary>
    [BearerAuth]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
        => await _authService.GetMeAsync(HttpContext.GetUserId());
}