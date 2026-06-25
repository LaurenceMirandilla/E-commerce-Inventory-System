using E_commerce_Inventory_System.Data;
using E_commerce_Inventory_System.DTO;
using E_commerce_Inventory_System.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace E_commerce_Inventory_System.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly InventoryDbContext db;

        public CustomersController(InventoryDbContext db)
        {
            this.db = db;
        }

        // GET /api/Customers
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var customers = await db.Customers
                .OrderBy(c => c.FullName)
                .Select(c => new CustomerDto
                {
                    CustomerId = c.CustomerId,
                    FullName = c.FullName,
                    Email = c.Email,
                    Phone = c.Phone,
                    Address = c.Address,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(customers);
        }

        // GET /api/Customers/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var customer = await db.Customers.FindAsync(id);
            if (customer is null) return NotFound();

            return Ok(new CustomerDto(customer));
        }

        // POST /api/Customers
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCustomerDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var customer = new Customer
            {
                FullName = dto.FullName,
                Email = dto.Email,
                Phone = dto.Phone,
                Address = dto.Address,
                CreatedAt = DateTime.UtcNow
            };

            db.Customers.Add(customer);
            await db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = customer.CustomerId }, new CustomerDto(customer));
        }
    }
}