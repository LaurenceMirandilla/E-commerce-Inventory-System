using Microsoft.EntityFrameworkCore;
using E_commerce_Inventory_System.Models;

namespace E_commerce_Inventory_System.Data
{
    public class InventoryDbContext(DbContextOptions<InventoryDbContext> options) : DbContext(options)
    {
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Product> Products => Set<Product>();
        public DbSet<Customer> Customers => Set<Customer>();
        public DbSet<Order> Orders => Set<Order>();
        public DbSet<OrderItem> OrderItems => Set<OrderItem>();
        public DbSet<StockMovement> StockMovements => Set<StockMovement>();

        protected override void OnModelCreating(ModelBuilder mb)
        {
            mb.Entity<Product>()
              .HasIndex(p => p.SKU).IsUnique();

            mb.Entity<Customer>()
              .HasIndex(c => c.Email).IsUnique();

            mb.Entity<Order>()
              .HasIndex(o => o.OrderNumber).IsUnique();

            mb.Entity<OrderItem>()
              .Property(oi => oi.Subtotal)
              .HasComputedColumnSql("[Quantity] * [UnitPrice]", stored: true);

            foreach (var entity in mb.Model.GetEntityTypes())
            {
                foreach (var prop in entity.GetProperties()
                             .Where(p => p.ClrType == typeof(DateTime) && p.Name is "CreatedAt" or "UpdatedAt"))
                {
                    prop.SetDefaultValueSql("GETUTCDATE()");
                }
            }
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;

            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.State == EntityState.Modified)
                {
                    if (entry.Properties.Any(p => p.Metadata.Name == "UpdatedAt"))
                        entry.Property("UpdatedAt").CurrentValue = now;
                }
            }

            return base.SaveChangesAsync(cancellationToken);
        }
    }
}
