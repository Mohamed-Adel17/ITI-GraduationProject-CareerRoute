using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Sessions
{
    public class RescheduleSessionResponseDto
    {

        public string Id { get; set; }
        public string Status { get; set; }

        public DateTime OriginalStartTime { get; set; }
        public DateTime RequestedStartTime { get; set; }

        public string RequestedBy { get; set; }
        public string RescheduleReason { get; set; }

        public DateTime RequestedAt { get; set; }

    }
}
