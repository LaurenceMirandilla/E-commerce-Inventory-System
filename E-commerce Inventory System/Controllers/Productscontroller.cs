using E_commerce_Inventory_System.Data;
using E_commerce_Inventory_System.DTO;
using E_commerce_Inventory_System.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(InventoryDbContext db) : ControllerBase
{
    // GET api/products?search=&categoryId=&lowStock=
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

    // GET api/products/5
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await db.Products.Include(p => p.Category)
                                 .FirstOrDefaultAsync(p => p.ProductId == id);
        if (p is null) return NotFound();
        return Ok(new ProductDto(p));
    }

    // POST api/products
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (await db.Products.AnyAsync(p => p.SKU == dto.SKU))
            return Conflict($"SKU '{dto.SKU}' already exists.");

        var product = new Product
        {
            SKU = dto.SKU,
            Name = dto.Name,
            Description = dto.Description,
            CategoryId = dto.CategoryId,
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

    // PUT api/products/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();

        product.Name = dto.Name;
        product.Description = dto.Description;
        product.CategoryId = dto.CategoryId;
        product.UnitPrice = dto.UnitPrice;
        product.CostPrice = dto.CostPrice;
        product.LowStockThreshold = dto.LowStockThreshold;
        product.IsActive = dto.IsActive;

        await db.SaveChangesAsync();
        return NoContent();
    }

    // PATCH api/products/5/stock
    [HttpPatch("{id:int}/stock")]
    public async Task<IActionResult> AdjustStock(int id, [FromBody] AdjustStockDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();

        var newQty = product.StockQuantity + dto.Quantity;
        if (newQty < 0) return BadRequest("Adjustment would result in negative stock.");

        product.StockQuantity = newQty;

        db.StockMovements.Add(new StockMovement
        {
            ProductId = id,
            MovementType = "Adjustment",
            Quantity = dto.Quantity,
            Notes = dto.Notes
        });

        await db.SaveChangesAsync();
        return Ok(new { product.StockQuantity });
    }

    // DELETE api/products/5 (soft delete)
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