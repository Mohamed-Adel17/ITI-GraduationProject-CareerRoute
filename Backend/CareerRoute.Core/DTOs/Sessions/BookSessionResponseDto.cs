using CareerRoute.Core.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Sessions
{
    public class BookSessionResponseDto
    {
        public string Id { get; set; } = null!;
        public string MenteeId { get; set; } = null!;
        public string MenteeFirstName { get; set; } = null!;
        public string MenteeLastName { get; set; } = null!;
        public string MentorId { get; set; } = null!;  
        public string MentorFirstName { get; set; } = null!;
        public string MentorLastName { get; set; } = null!;
        public string TimeSlotId { get; set; } = null!;

        public SessionTypeOptions SessionType { get; set; }
        public DurationOptions Duration { get; set; }
        public DateTime ScheduledStartTime { get; set; }
        public DateTime ScheduledEndTime { get; set; }
        public SessionStatusOptions Status { get; set; }
        public string? VideoConferenceLink { get; set; }
        public string? Topic { get; set; }
        public string? Notes { get; set; }
        public decimal Price { get; set; }
        public string? PaymentId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}

