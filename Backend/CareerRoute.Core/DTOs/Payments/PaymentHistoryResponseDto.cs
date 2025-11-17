namespace CareerRoute.Core.DTOs.Payments
{
    public class PaymentHistoryResponseDto
    {
        public PaginationMetadataDto PaginationMetadata { get; set; } = new();
        public IEnumerable<PaymentHistroyItemResponseDto> Payments { get; set; } = [];
        public PaymentHistorySummaryDto Summary { get; set; } = new();
    }
}
