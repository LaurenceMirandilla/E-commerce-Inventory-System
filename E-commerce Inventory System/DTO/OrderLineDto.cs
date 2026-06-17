using E_commerce_Inventory_System.Models;

namespace E_commerce_Inventory_System.DTO
{
    public class OrderLineDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Subtotal { get; set; }

        public OrderLineDto() { }

        public OrderLineDto(OrderItem oi)
        {
            ProductId = oi.ProductId;
            ProductName = oi.Product?.Name ?? "";
            Quantity = oi.Quantity;
            UnitPrice = oi.UnitPrice;
            Subtotal = oi.Subtotal;
        }
    }
}
