using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.DTOs.Disputes
{
    public class ResolveDisputeDto
    {
        public DisputeResolution Resolution { get; set; }
        public decimal? RefundAmount { get; set; }
        public string? AdminNotes { get; set; }
    }
}
