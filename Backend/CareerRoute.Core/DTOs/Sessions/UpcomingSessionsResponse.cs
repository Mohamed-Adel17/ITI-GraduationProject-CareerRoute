
namespace CareerRoute.Core.DTOs.Sessions
{
    public class UpcomingSessionsResponse
    {
        public List<UpcomingSessionItemResponseDto> Sessions { get; set; } = [];
        public PaginationMetadataDto Pagination { get; set; } = new();
    }
}
