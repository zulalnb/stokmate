using Microsoft.EntityFrameworkCore;
using StokMate.Api.Common;
using StokMate.Api.Data;
using StokMate.Api.Models;

namespace StokMate.Api.Services;

/// <summary>Product listing, creation, update, and deletion operations.</summary>
public class ProductService
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    private readonly AppDbContext _db;

    public ProductService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<ProductDto>> GetListAsync(ProductQuery query)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize < 1 ? DefaultPageSize : Math.Min(query.PageSize, MaxPageSize);

        var products = _db.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            var term = query.Q.Trim().ToLower();
            products = products.Where(p =>
                p.Name.ToLower().Contains(term) ||
                p.Sku.ToLower().Contains(term) ||
                p.Barcode.ToLower().Contains(term));
        }

        if (query.CategoryId is not null)
        {
            products = products.Where(p => p.CategoryId == query.CategoryId);
        }

        if (query.BrandId is not null)
        {
            products = products.Where(p => p.BrandId == query.BrandId);
        }

        if (query.Status is not null)
        {
            products = products.Where(p => p.Status == query.Status);
        }

        // The total is calculated before pagination is applied.
        var total = await products.CountAsync();

        var rows = await ApplySort(products, query.Sort, query.Dir)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<ProductDto>
        {
            Items = rows.Select(ToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ProductDetailDto> GetByIdAsync(int id)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new NotFoundException($"Product with ID {id} was not found.");

        return ToDetailDto(product);
    }

    public async Task<ProductStatsDto> GetStatsAsync() => new()
    {
        Total = await _db.Products.CountAsync(),
        OutOfStock = await _db.Products.CountAsync(p => p.Stock == 0),
        LowStock = await _db.Products.CountAsync(p => p.Stock <= p.MinStock && p.Stock > 0)
    };

    public async Task<ProductDto> CreateAsync(CreateProductRequest request)
    {
        ValidateFields(request.Name, request.Sku, request.Price, request.CostPrice,
            request.Stock, request.MinStock, request.Unit, request.Status);

        await EnsureRelationsExistAsync(request.CategoryId, request.BrandId, request.SupplierId);
        await EnsureSkuIsAvailableAsync(request.Sku, excludeProductId: null);

        var now = DateTime.UtcNow;
        var product = new Product
        {
            Name = request.Name.Trim(),
            Sku = request.Sku.Trim(),
            Barcode = request.Barcode?.Trim() ?? "",
            CategoryId = request.CategoryId,
            BrandId = request.BrandId,
            SupplierId = request.SupplierId,
            Price = request.Price,
            CostPrice = request.CostPrice,
            Stock = request.Stock,
            MinStock = request.MinStock,
            Unit = request.Unit,
            Status = request.Status,
            Description = request.Description?.Trim() ?? "",
            IsFeatured = request.IsFeatured,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        // The image URL is derived from the ID; the ID is only available after the record is created.
        product.ImageUrl = BuildImageUrl(product.Id);
        await _db.SaveChangesAsync();

        return await LoadDtoAsync(product.Id);
    }

    public async Task<ProductDto> UpdateAsync(int id, UpdateProductRequest request)
    {
        var product = await FindAsync(id);

        ValidateFields(request.Name, request.Sku, request.Price, request.CostPrice,
            request.Stock, request.MinStock, request.Unit, request.Status);

        await EnsureRelationsExistAsync(request.CategoryId, request.BrandId, request.SupplierId);
        await EnsureSkuIsAvailableAsync(request.Sku, excludeProductId: id);

        product.Name = request.Name.Trim();
        product.Sku = request.Sku.Trim();
        product.Barcode = request.Barcode?.Trim() ?? "";
        product.CategoryId = request.CategoryId;
        product.BrandId = request.BrandId;
        product.SupplierId = request.SupplierId;
        product.Price = request.Price;
        product.CostPrice = request.CostPrice;
        product.Stock = request.Stock;
        product.MinStock = request.MinStock;
        product.Unit = request.Unit;
        product.Status = request.Status;
        product.Description = request.Description?.Trim() ?? "";
        product.IsFeatured = request.IsFeatured;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return await LoadDtoAsync(product.Id);
    }

    public async Task<ProductDto> UpdateStockAsync(int id, UpdateStockRequest request)
    {
        if (request.Stock < 0)
        {
            throw new ValidationException("Stock cannot be negative.");
        }

        var product = await FindAsync(id);

        product.Stock = request.Stock;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return await LoadDtoAsync(product.Id);
    }

    public async Task DeleteAsync(int id)
    {
        var product = await FindAsync(id);

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();
    }

    private async Task<Product> FindAsync(int id)
        => await _db.Products.FirstOrDefaultAsync(p => p.Id == id)
           ?? throw new NotFoundException($"Product with ID {id} was not found.");

    /// <summary>Reloads the product with category and brand names for the response.</summary>
    private async Task<ProductDto> LoadDtoAsync(int id)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .FirstAsync(p => p.Id == id);

        return ToDto(product);
    }

    /// <summary>sort=name|price|stock|updatedAt, dir=asc|desc. Unknown values are sorted by name.</summary>
    private static IQueryable<Product> ApplySort(IQueryable<Product> products, string? sort, string? dir)
    {
        var descending = string.Equals(dir, "desc", StringComparison.OrdinalIgnoreCase);

        var ordered = sort?.Trim().ToLowerInvariant() switch
        {
            "price" => descending ? products.OrderByDescending(p => p.Price) : products.OrderBy(p => p.Price),
            "stock" => descending ? products.OrderByDescending(p => p.Stock) : products.OrderBy(p => p.Stock),
            "updatedat" => descending ? products.OrderByDescending(p => p.UpdatedAt) : products.OrderBy(p => p.UpdatedAt),
            _ => descending ? products.OrderByDescending(p => p.Name) : products.OrderBy(p => p.Name)
        };

        // Secondary key for consistent ordering across pages when values are equal.
        return ordered.ThenBy(p => p.Id);
    }

    private static void ValidateFields(string name, string sku, int price, int costPrice,
        int stock, int minStock, ProductUnit unit, ProductStatus status)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ValidationException("Product name is required.");
        }

        if (string.IsNullOrWhiteSpace(sku))
        {
            throw new ValidationException("SKU is required.");
        }

        if (price < 0)
        {
            throw new ValidationException("Price cannot be negative.");
        }

        if (costPrice < 0)
        {
            throw new ValidationException("Cost cannot be negative.");
        }

        if (stock < 0)
        {
            throw new ValidationException("Stock cannot be negative.");
        }

        if (minStock < 0)
        {
            throw new ValidationException("Minimum stock cannot be negative.");
        }

        if (!Enum.IsDefined(unit))
        {
            throw new ValidationException("Invalid unit value.");
        }

        if (!Enum.IsDefined(status))
        {
            throw new ValidationException("Invalid status value.");
        }
    }

    private async Task EnsureRelationsExistAsync(int categoryId, int brandId, int supplierId)
    {
        if (!await _db.Categories.AnyAsync(c => c.Id == categoryId))
        {
            throw new ValidationException($"Category with ID {categoryId} was not found.");
        }

        if (!await _db.Brands.AnyAsync(b => b.Id == brandId))
        {
            throw new ValidationException($"Brand with ID {brandId} was not found.");
        }

        if (!await _db.Suppliers.AnyAsync(s => s.Id == supplierId))
        {
            throw new ValidationException($"Supplier with ID {supplierId} was not found.");
        }
    }

    /// <summary>The same SKU cannot be used by multiple products.</summary>
    private async Task EnsureSkuIsAvailableAsync(string sku, int? excludeProductId)
    {
        var normalized = sku.Trim();
        var isTaken = await _db.Products.AnyAsync(p => p.Sku == normalized && p.Id != excludeProductId);

        if (isTaken)
        {
            throw new ConflictException($"SKU '{normalized}' is already used by another product.");
        }
    }

    internal static string BuildImageUrl(int productId) => $"https://picsum.photos/seed/{productId}/400/400";

    private static ProductDto ToDto(Product p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Sku = p.Sku,
        Barcode = p.Barcode,
        ImageUrl = p.ImageUrl,
        CategoryId = p.CategoryId,
        CategoryName = p.Category?.Name ?? "",
        BrandId = p.BrandId,
        BrandName = p.Brand?.Name ?? "",
        Price = p.Price,
        Stock = p.Stock,
        MinStock = p.MinStock,
        Unit = p.Unit,
        Status = p.Status,
        IsFeatured = p.IsFeatured,
        UpdatedAt = p.UpdatedAt
    };

    private static ProductDetailDto ToDetailDto(Product p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Sku = p.Sku,
        Barcode = p.Barcode,
        ImageUrl = p.ImageUrl,
        CategoryId = p.CategoryId,
        CategoryName = p.Category?.Name ?? "",
        BrandId = p.BrandId,
        BrandName = p.Brand?.Name ?? "",
        SupplierId = p.SupplierId,
        Price = p.Price,
        CostPrice = p.CostPrice,
        Stock = p.Stock,
        MinStock = p.MinStock,
        Unit = p.Unit,
        Status = p.Status,
        Description = p.Description,
        IsFeatured = p.IsFeatured,
        UpdatedAt = p.UpdatedAt
    };
}