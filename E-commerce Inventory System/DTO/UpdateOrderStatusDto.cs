using System.ComponentModel.DataAnnotations;

namespace E_commerce_Inventory_System.DTO
{
    public class UpdateOrderStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }
}
