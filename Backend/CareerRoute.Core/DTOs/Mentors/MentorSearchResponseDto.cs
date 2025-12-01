namespace CareerRoute.Core.DTOs.Mentors
{
    /// <summary>
    /// Response DTO containing search results with pagination and filter metadata
    /// </summary>
    public class MentorSearchResponseDto
    {
        public List<MentorProfileDto> Mentors { get; set; } = new();
        public PaginationMetadataDto Pagination { get; set; } = new();
        public AppliedFiltersDto AppliedFilters { get; set; } = new();
    }
}
