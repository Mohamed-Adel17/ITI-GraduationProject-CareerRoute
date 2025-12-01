using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Sessions
{
    public class RescheduleSessionRequestDto
    {
        public DateTime NewScheduledStartTime { get; set; }
        public string Reason { get; set; } = null!;
        public string? SlotId { get; set; }  // Optional - used when mentee reschedules to a specific slot
    }
}
