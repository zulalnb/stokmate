namespace StokMate.Api.Common;

/// <summary>The requested record was not found. Converted to 404 by ExceptionMiddleware.</summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message)
    {
    }
}

/// <summary>The request contains invalid data. Converted to 400 by ExceptionMiddleware.</summary>
public class ValidationException : Exception
{
    public ValidationException(string message) : base(message)
    {
    }
}

/// <summary>Authentication failed. Converted to 401 by ExceptionMiddleware.</summary>
public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message) : base(message)
    {
    }
}

/// <summary>The record conflicts with existing data. Converted to 409 by ExceptionMiddleware.</summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message)
    {
    }
}