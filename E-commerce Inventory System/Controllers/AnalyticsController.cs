using E_commerce_Inventory_System.Data;
using E_commerce_Inventory_System.DTO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace E_commerce_Inventory_System.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController(InventoryDbContext db) : ControllerBase
{
    [HttpGet("sales")]
    public async Task<ActionResult<IEnumerable<SalesSummaryDto>>> SalesSummary(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var start = from ?? DateTime.UtcNow.AddDays(-30);
        var end = to ?? DateTime.UtcNow;

        var result = await db.Orders
            .Where(o => o.Status != "Cancelled" && o.OrderDate >= start && o.OrderDate <= end)
            .GroupBy(o => o.OrderDate.Date)
            .Select(g => new SalesSummaryDto
            {
                SaleDate = DateOnly.FromDateTime(g.Key),
                TotalOrders = g.Count(),
                Revenue = g.Sum(o => o.TotalAmount),
                UnitsSold = g.SelectMany(o => o.OrderItems).Sum(oi => oi.Quantity)
            })
            .OrderBy(s => s.SaleDate)
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("inventory-value")]
    public async Task<ActionResult<InventoryValueDto>> InventoryValue()
    {
        var result = await db.Products
            .Where(p => p.IsActive)
            .GroupBy(_ => 1)
            .Select(g => new InventoryValueDto
            {
                TotalProducts = g.Count(),
                TotalUnits = g.Sum(p => p.StockQuantity),
                TotalCostValue = g.Sum(p => p.StockQuantity * p.CostPrice),
                TotalRetailValue = g.Sum(p => p.StockQuantity * p.UnitPrice)
            })
            .FirstOrDefaultAsync();

        return Ok(result ?? new InventoryValueDto());
    }

    [HttpGet("low-stock")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> LowStock()
    {
        var products = await db.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive && p.StockQuantity <= p.LowStockThreshold)
            .OrderBy(p => p.StockQuantity)
            .Select(p => new ProductDto(p))
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("top-products")]
    public async Task<IActionResult> TopProducts(
        [FromQuery] int limit = 5,
        [FromQuery] int days = 30)
    {
        var since = DateTime.UtcNow.AddDays(-days);

        var top = await db.OrderItems
            .Include(oi => oi.Product)
            .Where(oi => oi.Order.OrderDate >= since && oi.Order.Status != "Cancelled")
            .GroupBy(oi => new { oi.ProductId, oi.Product.Name })
            .Select(g => new
            {
                g.Key.ProductId,
                g.Key.Name,
                UnitsSold = g.Sum(oi => oi.Quantity),
                Revenue = g.Sum(oi => oi.Subtotal)
            })
            .OrderByDescending(x => x.UnitsSold)
            .Take(limit)
            .ToListAsync();

        return Ok(top);
    }
}