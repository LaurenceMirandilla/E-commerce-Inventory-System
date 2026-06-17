namespace E_commerce_Inventory_System.DTO
{
    public class SalesSummaryDto
    {
        public DateOnly SaleDate { get; set; }
        public int TotalOrders { get; set; }
        public decimal Revenue { get; set; }
        public int UnitsSold { get; set; }
    }
}
