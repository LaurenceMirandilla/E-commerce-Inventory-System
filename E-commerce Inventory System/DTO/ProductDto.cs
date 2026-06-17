using E_commerce_Inventory_System.Models;

namespace E_commerce_Inventory_System.DTO
{
    public class ProductDto
    {
        public int ProductId { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public decimal CostPrice { get; set; }
        public int StockQuantity { get; set; }
        public int LowStockThreshold { get; set; }
        public bool IsLowStock { get; set; }
        public bool IsActive { get; set; }

        public ProductDto() { }

        public ProductDto(Product p)
        {
            ProductId = p.ProductId;
            SKU = p.SKU;
            Name = p.Name;
            Description = p.Description;
            CategoryId = p.CategoryId;
            CategoryName = p.Category?.Name ?? "";
            UnitPrice = p.UnitPrice;
            CostPrice = p.CostPrice;
            StockQuantity = p.StockQuantity;
            LowStockThreshold = p.LowStockThreshold;
            IsLowStock = p.IsLowStock;
            IsActive = p.IsActive;
        }
    }
}
