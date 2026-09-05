using Microsoft.EntityFrameworkCore;
using StokMate.Api.Auth;
using StokMate.Api.Common;
using StokMate.Api.Data;
using StokMate.Api.Models;

namespace StokMate.Api.Services;

/// <summary>Login, token refresh, and logout operations.</summary>
public class AuthService
{
    /// <summary>Refresh token lifetime.</summary>
    private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(7);

    private readonly AppDbContext _db;
    private readonly TokenService _tokenService;

    public AuthService(AppDbContext db, TokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ValidationException("Email and password are required.");
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        // Both a missing user and an incorrect password return the same message;
        // this prevents revealing which email addresses are registered.
        if (user is null || !PasswordHasher.Verify(request.Password, user.PasswordSalt, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid email or password.");
        }

        return await IssueTokensAsync(user);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            throw new ValidationException("Refresh token is required.");
        }

        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == request.RefreshToken);

        if (stored is null || stored.RevokedAt is not null || stored.ExpiresAt <= DateTime.UtcNow)
        {
            throw new UnauthorizedException("Invalid or expired refresh token.");
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == stored.UserId)
                   ?? throw new UnauthorizedException("Invalid or expired refresh token.");

        // Rotation: the used token is revoked and replaced with a new one.
        // This ensures a stolen token can be used at most once.
        stored.RevokedAt = DateTime.UtcNow;

        return await IssueTokensAsync(user);
    }

    public async Task LogoutAsync(string refreshToken, int userId)
    {
        var stored = await _db.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == refreshToken && t.UserId == userId);

        // Logout is considered successful in all cases; no error is returned if the token is already revoked.
        if (stored is not null && stored.RevokedAt is null)
        {
            stored.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        // Since access tokens are kept in memory, the user's active tokens are also revoked
        // to fully terminate the session.
        _tokenService.RevokeAllForUser(userId);
    }

    public async Task<UserDto> GetMeAsync(int userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId)
                   ?? throw new NotFoundException("User not found.");

        return ToDto(user);
    }

    /// <summary>Generates a new access + refresh token pair for the user.</summary>
    private async Task<AuthResponse> IssueTokensAsync(User user)
    {
        var (accessToken, expiresAt) = _tokenService.Issue(user.Id);

        var refreshToken = new RefreshToken
        {
            Token = Guid.NewGuid().ToString("N"),
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.Add(RefreshTokenLifetime)
        };

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Token,
            ExpiresAt = expiresAt,
            User = ToDto(user)
        };
    }

    private static UserDto ToDto(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FullName = user.FullName
    };
}