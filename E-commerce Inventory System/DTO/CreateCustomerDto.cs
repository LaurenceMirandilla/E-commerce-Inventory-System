using System.ComponentModel.DataAnnotations;

namespace E_commerce_Inventory_System.DTO
{
    public class CreateCustomerDto
    {
        [Required, MaxLength(200)]
        public string FullName { get; set; } = string.Empty;

        [Required, MaxLength(254), EmailAddress]
        public string Email { get; set; } = string.Empty;

        [MaxLength(30)]
        public string? Phone { get; set; }

        [MaxLength(500)]
        public string? Address { get; set; }
    }
}