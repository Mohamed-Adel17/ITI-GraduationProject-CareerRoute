namespace CareerRoute.Core.DTOs.Payments
{
    public class PaymentHistorySummaryDto
    {
        public decimal TotalSpent { get; set; }
        public decimal TotalRefunded { get; set; }
        public decimal NetSpent { get; set; }
    }
}
