using System.ComponentModel.DataAnnotations;

namespace E_commerce_Inventory_System.DTO
{
    public class AdjustStockDto
    {
        [Required]
        public int Quantity { get; set; }
        public string? Notes { get; set; }
    }

}
