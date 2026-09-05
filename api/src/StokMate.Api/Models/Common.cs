namespace StokMate.Api.Models;

/// <summary>Paginated list response.</summary>
public class PagedResult<T>
{
    /// <summary>Records on the current page.</summary>
    public List<T> Items { get; set; } = new();

    /// <summary>Total number of records matching the filters (before pagination).</summary>
    public int Total { get; set; }

    /// <summary>Current page number (starts at 1).</summary>
    public int Page { get; set; }

    /// <summary>Number of records per page.</summary>
    public int PageSize { get; set; }
}