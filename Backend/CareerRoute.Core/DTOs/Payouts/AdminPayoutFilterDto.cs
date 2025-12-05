using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.DTOs.Payouts
{
    public class AdminPayoutFilterDto
    {
        public string? MentorId { get; set; }
        public string? MentorName { get; set; }
        public PayoutStatus? Status { get; set; }
        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? SortBy { get; set; } = "RequestedAt";
        public bool SortDescending { get; set; } = false;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
