using E_commerce_Inventory_System.Data;
using E_commerce_Inventory_System.DTO;
using E_commerce_Inventory_System.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace E_commerce_Inventory_System.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController(InventoryDbContext db) : ControllerBase
{

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status = null,
        [FromQuery] int? customerId = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var q = db.Orders
                  .Include(o => o.Customer)
                  .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                  .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(o => o.Status == status);
        if (customerId != null) q = q.Where(o => o.CustomerId == customerId);
        if (from != null) q = q.Where(o => o.OrderDate >= from);
        if (to != null) q = q.Where(o => o.OrderDate <= to);

        var result = await q.OrderByDescending(o => o.OrderDate)
                            .Select(o => new OrderDto(o))
                            .ToListAsync();
        return Ok(result);
    }


    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await db.Orders
                            .Include(o => o.Customer)
                            .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                            .FirstOrDefaultAsync(o => o.OrderId == id);
        if (order is null) return NotFound();
        return Ok(new OrderDto(order));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (!await db.Customers.AnyAsync(c => c.CustomerId == dto.CustomerId))
            return BadRequest("Customer not found.");

        var productIds = dto.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await db.Products
                                 .Where(p => productIds.Contains(p.ProductId) && p.IsActive)
                                 .ToDictionaryAsync(p => p.ProductId);

        foreach (var item in dto.Items)
        {
            if (!products.TryGetValue(item.ProductId, out var prod))
                return BadRequest($"Product {item.ProductId} not found or inactive.");
            if (prod.StockQuantity < item.Quantity)
                return BadRequest($"Insufficient stock for '{prod.Name}'. Available: {prod.StockQuantity}.");
        }

        var orderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

        var order = new Order
        {
            OrderNumber = orderNumber,
            CustomerId = dto.CustomerId,
            Notes = dto.Notes,
            Status = "Pending"
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync();

        decimal total = 0;
        foreach (var item in dto.Items)
        {
            var prod = products[item.ProductId];
            total += prod.UnitPrice * item.Quantity;

            db.OrderItems.Add(new OrderItem
            {
                OrderId = order.OrderId,
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = prod.UnitPrice
            });

            prod.StockQuantity -= item.Quantity;

            db.StockMovements.Add(new StockMovement
            {
                ProductId = item.ProductId,
                MovementType = "Sale",
                Quantity = -item.Quantity,
                Reference = orderNumber
            });
        }

        order.TotalAmount = total;
        await db.SaveChangesAsync();

        var created = await db.Orders
                              .Include(o => o.Customer)
                              .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                              .FirstAsync(o => o.OrderId == order.OrderId);

        return CreatedAtAction(nameof(GetById), new { id = order.OrderId }, new OrderDto(created));
    }


    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var allowed = new[] { "Pending", "Processing", "Shipped", "Delivered", "Cancelled" };
        if (!allowed.Contains(dto.Status))
            return BadRequest($"Invalid status. Allowed: {string.Join(", ", allowed)}");

        var order = await db.Orders
                            .Include(o => o.OrderItems)
                            .FirstOrDefaultAsync(o => o.OrderId == id);
        if (order is null) return NotFound();

        if (dto.Status == "Cancelled" && order.Status != "Cancelled")
        {
            foreach (var item in order.OrderItems)
            {
                var prod = await db.Products.FindAsync(item.ProductId);
                if (prod != null) prod.StockQuantity += item.Quantity;

                db.StockMovements.Add(new StockMovement
                {
                    ProductId = item.ProductId,
                    MovementType = "Return",
                    Quantity = item.Quantity,
                    Reference = order.OrderNumber,
                    Notes = "Order cancelled"
                });
            }
        }

        order.Status = dto.Status;
        await db.SaveChangesAsync();
        return NoContent();
    }
}