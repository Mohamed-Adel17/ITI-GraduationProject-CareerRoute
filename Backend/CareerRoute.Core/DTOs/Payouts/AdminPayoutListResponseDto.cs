namespace CareerRoute.Core.DTOs.Payouts
{
    public class AdminPayoutListResponseDto
    {
        public List<AdminPayoutDto> Payouts { get; set; } = [];
        public PaginationMetadataDto Pagination { get; set; } = new();
    }
}
