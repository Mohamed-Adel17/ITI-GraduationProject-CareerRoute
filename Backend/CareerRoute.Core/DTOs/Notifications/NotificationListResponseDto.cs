namespace CareerRoute.Core.DTOs.Notifications
{
    public class NotificationListResponseDto
    {
        public List<NotificationDto> Items { get; set; } = new();
        public PaginationMetadataDto Pagination { get; set; } = new();
    }
}
