using E_commerce_Inventory_System.Data;
using E_commerce_Inventory_System.DTO;
using E_commerce_Inventory_System.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace E_commerce_Inventory_System.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController(InventoryDbContext db) : ControllerBase
{
    // GET /api/categories — includes a live product count per category.
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await db.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                Description = c.Description,
                ProductCount = c.Products.Count,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var category = await db.Categories
            .Where(c => c.CategoryId == id)
            .Select(c => new CategoryDto
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                Description = c.Description,
                ProductCount = c.Products.Count,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (category is null) return NotFound();
        return Ok(category);
    }

    // POST /api/categories — rejects exact-name duplicates (case-insensitive).
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var name = dto.Name.Trim();
        if (await db.Categories.AnyAsync(c => c.Name.ToLower() == name.ToLower()))
            return Conflict($"A category named '{name}' already exists.");

        var category = new Category
        {
            Name = name,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Categories.Add(category);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = category.CategoryId }, new CategoryDto
        {
            CategoryId = category.CategoryId,
            Name = category.Name,
            Description = category.Description,
            ProductCount = 0,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        });
    }

    // PUT /api/categories/{id} — rename/update description. Same duplicate
    // check as create, excluding the category being edited.
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateCategoryDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var category = await db.Categories.FindAsync(id);
        if (category is null) return NotFound();

        var name = dto.Name.Trim();
        if (await db.Categories.AnyAsync(c => c.CategoryId != id && c.Name.ToLower() == name.ToLower()))
            return Conflict($"A category named '{name}' already exists.");

        category.Name = name;
        category.Description = dto.Description;
        category.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/categories/{id} — blocked if the category still has any
    // products, since Product.CategoryId is a required FK. The frontend
    // should disable the delete action whenever ProductCount > 0 rather
    // than relying on this 409 as the only signal.
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await db.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.CategoryId == id);

        if (category is null) return NotFound();

        if (category.Products.Count > 0)
            return Conflict($"Cannot delete '{category.Name}' — it still has {category.Products.Count} product(s) assigned to it.");

        db.Categories.Remove(category);
        await db.SaveChangesAsync();
        return NoContent();
    }
}