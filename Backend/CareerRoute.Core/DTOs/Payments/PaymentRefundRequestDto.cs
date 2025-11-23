using System.ComponentModel.DataAnnotations;

namespace CareerRoute.Core.DTOs.Payments
{
    public class PaymentRefundRequestDto
    {
        [Required]
        [Range(1, 100, ErrorMessage = "Percentage must be between 1 and 100")]
        public decimal Percentage { get; set; }
    }
}
