namespace E_commerce_Inventory_System.DTO
{
    public class CustomerDto
    {
        public int CustomerId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public DateTime CreatedAt { get; set; }

        public CustomerDto() { }

        public CustomerDto(E_commerce_Inventory_System.Models.Customer c)
        {
            CustomerId = c.CustomerId;
            FullName = c.FullName;
            Email = c.Email;
            Phone = c.Phone;
            Address = c.Address;
            CreatedAt = c.CreatedAt;
        }
    }
}