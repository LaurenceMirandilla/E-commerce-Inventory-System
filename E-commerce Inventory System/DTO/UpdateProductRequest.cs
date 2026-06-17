namespace E_commerce_Inventory_System.DTO
{
    public class UpdateProductRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int CategoryId { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal CostPrice { get; set; }
        public int LowStockThreshold { get; set; }
        public bool IsActive { get; set; }
    }
}
