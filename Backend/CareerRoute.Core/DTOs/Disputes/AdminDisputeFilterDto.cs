using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.DTOs.Disputes
{
    public class AdminDisputeFilterDto
    {
        public DisputeStatus? Status { get; set; }
        public DisputeReason? Reason { get; set; }
        public string? MenteeId { get; set; }
        public string? MentorId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? SortBy { get; set; }
        public bool SortDescending { get; set; } = true;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
