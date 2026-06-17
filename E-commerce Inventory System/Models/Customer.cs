using System.ComponentModel.DataAnnotations;

namespace E_commerce_Inventory_System.Models
{
    public class Customer
    {
        [Key]
        public int CustomerId { get; set; }

        [Required, MaxLength(200)]
        public string FullName { get; set; } = string.Empty;

        [Required, MaxLength(254)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(30)]
        public string? Phone { get; set; }

        [MaxLength(500)]
        public string? Address { get; set; }

        public DateTime CreatedAt { get; set; }
        public ICollection<Order> Orders { get; set; } = [];
    }
}
