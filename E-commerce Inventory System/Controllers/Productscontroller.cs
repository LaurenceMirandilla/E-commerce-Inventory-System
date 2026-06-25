using E_commerce_Inventory_System.Data;
using E_commerce_Inventory_System.DTO;
using E_commerce_Inventory_System.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace E_commerce_Inventory_System.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(InventoryDbContext db) : ControllerBase
{
    // GET /api/products?search=&categoryId=&lowStock=&activeOnly=
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] bool? lowStock = null,
        [FromQuery] bool activeOnly = true)
    {
        var q = db.Products.Include(p => p.Category).AsQueryable();

        if (activeOnly) q = q.Where(p => p.IsActive);
        if (categoryId != null) q = q.Where(p => p.CategoryId == categoryId);
        if (lowStock == true) q = q.Where(p => p.StockQuantity <= p.LowStockThreshold);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var isId = int.TryParse(search, out var searchId);
            q = q.Where(p =>
                p.Name.Contains(search) ||
                p.SKU.Contains(search) ||
                (isId && p.ProductId == searchId));
        }

        var result = await q.OrderBy(p => p.Name)
                            .Select(p => new ProductDto(p))
                            .ToListAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await db.Products.Include(p => p.Category)
                                 .FirstOrDefaultAsync(p => p.ProductId == id);
        if (p is null) return NotFound();
        return Ok(new ProductDto(p));
    }

    // POST /api/products — body: CreateProductDto { ..., CategoryName }
    // CategoryName is looked up by exact (Trim()'d) match against existing
    // Categories. If no match exists, a new Category row is created
    // automatically and the new product is linked to it.
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (await db.Products.AnyAsync(p => p.SKU == dto.SKU))
            return Conflict($"SKU '{dto.SKU}' already exists.");

        var categoryName = dto.CategoryName.Trim();
        var category = await db.Categories.FirstOrDefaultAsync(c => c.Name == categoryName);
        if (category is null)
        {
            category = new Category { Name = categoryName };
            db.Categories.Add(category);
            await db.SaveChangesAsync();
        }

        var product = new Product
        {
            SKU = dto.SKU,
            Name = dto.Name,
            Description = dto.Description,
            CategoryId = category.CategoryId,
            UnitPrice = dto.UnitPrice,
            CostPrice = dto.CostPrice,
            StockQuantity = dto.StockQuantity,
            LowStockThreshold = dto.LowStockThreshold
        };

        db.Products.Add(product);
        await db.SaveChangesAsync();
        await db.Entry(product).Reference(p => p.Category).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = product.ProductId }, new ProductDto(product));
    }

    // PUT /api/products/{id} — body: UpdateProductDto { ..., CategoryName, StockQuantity }
    // StockQuantity here is an ABSOLUTE value — the frontend has no separate
    // stock-adjustment call, it always sends the full new total via this
    // endpoint along with every other field.
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();

        var categoryName = dto.CategoryName.Trim();
        var category = await db.Categories.FirstOrDefaultAsync(c => c.Name == categoryName);
        if (category is null)
        {
            category = new Category { Name = categoryName };
            db.Categories.Add(category);
            await db.SaveChangesAsync();
        }

        product.SKU = dto.SKU;
        product.Name = dto.Name;
        product.Description = dto.Description;
        product.CategoryId = category.CategoryId;
        product.UnitPrice = dto.UnitPrice;
        product.CostPrice = dto.CostPrice;
        product.StockQuantity = dto.StockQuantity;
        product.LowStockThreshold = dto.LowStockThreshold;
        product.IsActive = dto.IsActive;

        await db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/products/{id} — soft delete (IsActive = false).
    // Combined with GetAll's activeOnly=true default, deactivated products
    // disappear from the default product list unless the frontend explicitly
    // requests ?activeOnly=false.
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();
        product.IsActive = false;
        await db.SaveChangesAsync();
        return NoContent();
    }
}