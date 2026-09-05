using StokMate.Api.Data;

namespace StokMate.Api.Models;

/// <summary>Product response. Prices are expressed in KURUŞ (1999 = 19.99 TRY).</summary>
public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Sku { get; set; } = "";
    public string Barcode { get; set; } = "";
    public string ImageUrl { get; set; } = "";

    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = "";

    public int BrandId { get; set; }
    public string BrandName { get; set; } = "";

    /// <summary>Sale price, expressed in KURUŞ.</summary>
    public int Price { get; set; }

    public int Stock { get; set; }
    public int MinStock { get; set; }

    public ProductUnit Unit { get; set; }
    public ProductStatus Status { get; set; }

    public bool IsFeatured { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>Response for GET /products/{id}. Prices are expressed in KURUŞ (1999 = 19.99 TRY).</summary>
public class ProductDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Sku { get; set; } = "";
    public string Barcode { get; set; } = "";
    public string ImageUrl { get; set; } = "";

    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = "";

    public int BrandId { get; set; }
    public string BrandName { get; set; } = "";

    public int SupplierId { get; set; }

    /// <summary>Sale price, expressed in KURUŞ.</summary>
    public int Price { get; set; }

    /// <summary>Purchase cost, expressed in KURUŞ.</summary>
    public int CostPrice { get; set; }

    public int Stock { get; set; }
    public int MinStock { get; set; }

    public ProductUnit Unit { get; set; }
    public ProductStatus Status { get; set; }

    public string Description { get; set; } = "";
    public bool IsFeatured { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>Query parameters for GET /products.</summary>
public class ProductQuery
{
    /// <summary>Search term.</summary>
    public string? Q { get; set; }

    public int? CategoryId { get; set; }
    public int? BrandId { get; set; }
    public ProductStatus? Status { get; set; }

    /// <summary>Starts at 1.</summary>
    public int Page { get; set; } = 1;

    /// <summary>Defaults to 20, with a maximum of 100.</summary>
    public int PageSize { get; set; } = 20;

    /// <summary>name | price | stock | updatedAt</summary>
    public string? Sort { get; set; }

    /// <summary>asc | desc</summary>
    public string? Dir { get; set; }
}

/// <summary>Request body for POST /products.</summary>
public class CreateProductRequest
{
    public string Name { get; set; } = "";
    public string Sku { get; set; } = "";
    public string? Barcode { get; set; }

    public int CategoryId { get; set; }
    public int BrandId { get; set; }
    public int SupplierId { get; set; }

    /// <summary>Sale price, expressed in KURUŞ.</summary>
    public int Price { get; set; }

    /// <summary>Purchase cost, expressed in KURUŞ.</summary>
    public int CostPrice { get; set; }

    public int Stock { get; set; }
    public int MinStock { get; set; }

    public ProductUnit Unit { get; set; } = ProductUnit.Adet;
    public ProductStatus Status { get; set; } = ProductStatus.Aktif;

    public string? Description { get; set; }
    public bool IsFeatured { get; set; }
}

/// <summary>Request body for PUT /products/{id}. All product fields are sent.</summary>
public class UpdateProductRequest
{
    public string Name { get; set; } = "";
    public string Sku { get; set; } = "";
    public string? Barcode { get; set; }

    public int CategoryId { get; set; }
    public int BrandId { get; set; }
    public int SupplierId { get; set; }

    /// <summary>Sale price, expressed in KURUŞ.</summary>
    public int Price { get; set; }

    /// <summary>Purchase cost, expressed in KURUŞ.</summary>
    public int CostPrice { get; set; }

    public int Stock { get; set; }
    public int MinStock { get; set; }

    public ProductUnit Unit { get; set; } = ProductUnit.Adet;
    public ProductStatus Status { get; set; } = ProductStatus.Aktif;

    public string? Description { get; set; }
    public bool IsFeatured { get; set; }
}

/// <summary>Request body for PATCH /products/{id}/stock.</summary>
public class UpdateStockRequest
{
    public int Stock { get; set; }
}

/// <summary>Response for GET /products/stats.</summary>
public class ProductStatsDto
{
    /// <summary>Total number of products.</summary>
    public int Total { get; set; }

    /// <summary>Number of products that are out of stock.</summary>
    public int OutOfStock { get; set; }

    /// <summary>Number of products that have reached the critical stock threshold but are not out of stock.</summary>
    public int LowStock { get; set; }
}