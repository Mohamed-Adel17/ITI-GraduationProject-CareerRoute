using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.DTOs.Disputes
{
    public class CreateDisputeDto
    {
        public DisputeReason Reason { get; set; }
        public string? Description { get; set; }
    }
}
