namespace CareerRoute.Core.DTOs.Payouts
{
    public class MentorBalanceDto
    {
        public string MentorId { get; set; } = string.Empty;
        public decimal AvailableBalance { get; set; }
        public decimal PendingBalance { get; set; }
        public decimal TotalEarnings { get; set; }
        public DateTime LastUpdated { get; set; }
    }
}
