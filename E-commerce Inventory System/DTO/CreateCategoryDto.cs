using System.ComponentModel.DataAnnotations;

namespace E_commerce_Inventory_System.DTO
{
    public class CreateCategoryDto
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }
    }
}