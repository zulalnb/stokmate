namespace StokMate.Api.Models;

public class LoginRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class RefreshRequest
{
    public string RefreshToken { get; set; } = "";
}

public class LogoutRequest
{
    public string RefreshToken { get; set; } = "";
}

public class UserDto
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string FullName { get; set; } = "";
}

/// <summary>Common response for login and refresh endpoints.</summary>
public class AuthResponse
{
    public string AccessToken { get; set; } = "";
    public string RefreshToken { get; set; } = "";

    /// <summary>The expiration time of the access token (UTC).</summary>
    public DateTime ExpiresAt { get; set; }

    public UserDto User { get; set; } = new();
}