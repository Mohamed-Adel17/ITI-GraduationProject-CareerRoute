using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.DTOs.Sessions
{
    public class SessionPaymentResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public SessionStatusOptions Status { get; set; }
        public string VideoConferenceLink { get; set; } = string.Empty;
        public DateTime ScheduledStartTime { get; set; }
    }


}
