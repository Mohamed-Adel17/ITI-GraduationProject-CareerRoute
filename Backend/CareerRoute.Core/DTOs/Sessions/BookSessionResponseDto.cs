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
        public string Id { get; set; }
        public string MenteeId { get; set; }
        public string MenteeFirstName { get; set; }
        public string MenteeLastName { get; set; }
        public string MentorId { get; set; }  
        public string MentorFirstName { get; set; }
        public string MentorLastName { get; set; }
        public string TimeSlotId { get; set; }

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

