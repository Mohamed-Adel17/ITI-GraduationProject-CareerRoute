namespace CareerRoute.Core.DTOs
{
    /// <summary>
    /// Pagination metadata for search results
    /// </summary>
    public class PaginationMetadataDto
    {
        public int TotalCount { get; set; }
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }
}
