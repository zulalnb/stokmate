using System.Security.Cryptography;
using System.Text;

namespace StokMate.Api.Auth;

/// <summary>
/// Generates a password hash using a user-specific salt + SHA256.
/// Note: In a real-world product, a slow hashing algorithm such as PBKDF2/BCrypt
/// would be preferred; SHA256 is used here to avoid introducing additional dependencies.
/// </summary>
public static class PasswordHasher
{
    /// <summary>A random salt generated once when the user is created.</summary>
    public static string CreateSalt() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));

    public static string Hash(string password, string salt)
        => Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(salt + password)));

    /// <summary>Verifies the password using a constant-time comparison to mitigate timing attacks.</summary>
    public static bool Verify(string password, string salt, string expectedHash)
        => CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(Hash(password, salt)),
            Encoding.UTF8.GetBytes(expectedHash));
}