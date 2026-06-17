namespace E_commerce_Inventory_System.DTO
{
    public class CreateOrderRequest
    {
        public int CustomerId { get; set; }
        public string? Notes { get; set; }
        public List<OrderItemRequest> Items { get; set; } = [];
    }
}
