using CareerRoute.Core.DTOs;

namespace CareerRoute.Core.DTOs.Payouts
{
    public class PayoutHistoryResponseDto
    {
        public List<PayoutDto> Payouts { get; set; } = [];
        public PaginationMetadataDto Pagination { get; set; } = new();
    }
}
