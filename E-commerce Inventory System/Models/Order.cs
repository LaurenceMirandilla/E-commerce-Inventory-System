using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace E_commerce_Inventory_System.Models
{
    public class Order
    {
        [Key]
        public int OrderId { get; set; }

        [Required, MaxLength(20)]
        public string OrderNumber { get; set; } = string.Empty;

        public int CustomerId { get; set; }
        public Customer Customer { get; set; } = null!;

        [MaxLength(20)]
        public string Status { get; set; } = "Pending";

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        public DateTime OrderDate { get; set; }
        public DateTime UpdatedAt { get; set; }

        public ICollection<OrderItem> OrderItems { get; set; } = [];
    }
}
