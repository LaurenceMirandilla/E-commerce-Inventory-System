using System.ComponentModel.DataAnnotations;

namespace E_commerce_Inventory_System.Models
{
    public class StockMovement
    {
        [Key]
        public int MovementId { get; set; }
        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;

        [MaxLength(20)]
        public string MovementType { get; set; } = string.Empty;

        public int Quantity { get; set; }

        [MaxLength(100)]
        public string? Reference { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
