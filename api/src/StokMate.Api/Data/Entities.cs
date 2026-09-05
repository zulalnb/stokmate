namespace StokMate.Api.Data;

/// <summary>A user who can log in to the application.</summary>
public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string FullName { get; set; } = "";

    /// <summary>The SHA256 hash of the salt + password. The password itself is never stored.</summary>
    public string PasswordHash { get; set; } = "";

    /// <summary>A user-specific salt that prevents identical passwords from producing identical hashes.</summary>
    public string PasswordSalt { get; set; } = "";
}

/// <summary>An opaque token stored in the database and used to refresh an access token.</summary>
public class RefreshToken
{
    public int Id { get; set; }
    public string Token { get; set; } = "";
    public int UserId { get; set; }
    public DateTime ExpiresAt { get; set; }

    /// <summary>If set, the token has been revoked (due to refresh token rotation or logout).</summary>
    public DateTime? RevokedAt { get; set; }

    public DateTime CreatedAt { get; set; }
}

/// <summary>A product category.</summary>
public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";

    /// <summary>The display order in lists.</summary>
    public int SortOrder { get; set; }
}

/// <summary>A product brand.</summary>
public class Brand
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

/// <summary>The company that supplies the product.</summary>
public class Supplier
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string ContactName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public string City { get; set; } = "";
}

/// <summary>The product's sales unit.</summary>
public enum ProductUnit
{
    Adet = 1,
    Kg = 2,
    Lt = 3,
    Paket = 4
}

/// <summary>The product's sales status.</summary>
public enum ProductStatus
{
    Aktif = 1,
    Pasif = 2,
    UretimDurduruldu = 3
}

/// <summary>A product tracked in inventory.</summary>
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";

    /// <summary>Stock keeping unit; unique across products.</summary>
    public string Sku { get; set; } = "";

    public string Barcode { get; set; } = "";
    public string ImageUrl { get; set; } = "";

    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public int BrandId { get; set; }
    public Brand? Brand { get; set; }

    public int SupplierId { get; set; }
    public Supplier? Supplier { get; set; }

    /// <summary>Sale price, stored in KURUŞ. Example: 1999 = 19.99 TL.</summary>
    public int Price { get; set; }

    /// <summary>Purchase cost, stored in KURUŞ.</summary>
    public int CostPrice { get; set; }

    public int Stock { get; set; }

    /// <summary>Critical stock threshold; the product is considered "low stock" when inventory falls below this value.</summary>
    public int MinStock { get; set; }

    public ProductUnit Unit { get; set; }
    public ProductStatus Status { get; set; }

    public string Description { get; set; } = "";
    public bool IsFeatured { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}