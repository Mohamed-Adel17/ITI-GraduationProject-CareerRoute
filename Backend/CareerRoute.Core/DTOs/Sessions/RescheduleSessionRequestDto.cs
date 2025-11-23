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

    }
}
