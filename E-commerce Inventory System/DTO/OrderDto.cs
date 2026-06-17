using E_commerce_Inventory_System.Models;

namespace E_commerce_Inventory_System.DTO
{
    public class OrderDto
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public DateTime OrderDate { get; set; }
        public List<OrderLineDto> Items { get; set; } = [];

        public OrderDto() { }

        public OrderDto(Order o)
        {
            OrderId = o.OrderId;
            OrderNumber = o.OrderNumber;
            CustomerId = o.CustomerId;
            CustomerName = o.Customer?.FullName ?? "";
            Status = o.Status;
            TotalAmount = o.TotalAmount;
            OrderDate = o.OrderDate;
            Items = o.OrderItems.Select(oi => new OrderLineDto(oi)).ToList();
        }
    }
}
