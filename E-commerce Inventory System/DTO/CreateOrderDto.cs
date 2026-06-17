using System.ComponentModel.DataAnnotations;

namespace E_commerce_Inventory_System.DTO
{
    public class CreateOrderDto
    {
        [Required]
        public int CustomerId { get; set; }
        public string? Notes { get; set; }

        [Required]
        [MinLength(1)]
        public List<OrderItemDto> Items { get; set; } = [];
    }
}
