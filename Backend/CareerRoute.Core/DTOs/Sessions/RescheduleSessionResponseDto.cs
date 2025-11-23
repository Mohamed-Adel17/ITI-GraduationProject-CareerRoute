using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Sessions
{
    public class RescheduleSessionResponseDto
    {

        public string Id { get; set; } = null!;
        public string Status { get; set; } = null!;

        public DateTime OriginalStartTime { get; set; }
        public DateTime RequestedStartTime { get; set; }

        public string RequestedBy { get; set; } = null!;
        public string RescheduleReason { get; set; } = null!;

        public DateTime RequestedAt { get; set; }

    }
}
