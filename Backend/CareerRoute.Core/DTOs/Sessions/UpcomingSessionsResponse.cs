
namespace CareerRoute.Core.DTOs.Sessions
{
    public class UpcomingSessionsResponse
    {
        public List<UpCommingSessionItemResponseDto> Sessions { get; set; } = [];
        public PaginationMetadataDto Pagination { get; set; } = new();
    }
}
