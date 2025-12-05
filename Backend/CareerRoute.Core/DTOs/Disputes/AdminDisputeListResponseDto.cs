namespace CareerRoute.Core.DTOs.Disputes
{
    public class AdminDisputeListResponseDto
    {
        public List<AdminDisputeDto> Disputes { get; set; } = new();
        public PaginationMetadataDto Pagination { get; set; } = null!;
    }
}
