using System.Collections.Concurrent;

namespace StokMate.Api.Auth;

/// <summary>
/// Generates opaque (GUID) access tokens and stores them in process memory.
/// Since tokens are stored in memory, the service is registered as a singleton in DI;
/// all sessions are invalidated when the application restarts.
/// </summary>
public class TokenService
{
    /// <summary>The lifetime of an access token.</summary>
    public static readonly TimeSpan AccessTokenLifetime = TimeSpan.FromMinutes(15);

    private readonly ConcurrentDictionary<string, AccessToken> _tokens = new();

    private record AccessToken(int UserId, DateTime ExpiresAt);

    /// <summary>Generates a new access token for the user.</summary>
    public (string Token, DateTime ExpiresAt) Issue(int userId)
    {
        var token = Guid.NewGuid().ToString("N");
        var expiresAt = DateTime.UtcNow.Add(AccessTokenLifetime);

        _tokens[token] = new AccessToken(userId, expiresAt);
        return (token, expiresAt);
    }

    /// <summary>Returns the user's Id if the token is valid; otherwise, returns null.</summary>
    public int? Validate(string token)
    {
        if (!_tokens.TryGetValue(token, out var entry))
        {
            return null;
        }

        if (entry.ExpiresAt <= DateTime.UtcNow)
        {
            // Expired tokens are removed from memory.
            _tokens.TryRemove(token, out _);
            return null;
        }

        return entry.UserId;
    }

    /// <summary>Revokes all access tokens for the user (when logging out).</summary>
    public void RevokeAllForUser(int userId)
    {
        foreach (var pair in _tokens.Where(p => p.Value.UserId == userId))
        {
            _tokens.TryRemove(pair.Key, out _);
        }
    }
}