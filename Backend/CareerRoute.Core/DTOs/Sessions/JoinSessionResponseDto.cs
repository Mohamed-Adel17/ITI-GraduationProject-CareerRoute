using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Sessions
{
    public class JoinSessionResponseDto
    {

        public string SessionId { get; set; }
        public string VideoConferenceLink { get; set; }
        public string Provider { get; set; }
        public DateTime ScheduledStartTime { get; set; }
        public DateTime ScheduledEndTime { get; set; }
        public bool CanJoinNow { get; set; }
        public int MinutesUntilStart { get; set; }
        public string Instructions { get; set; }



    }
}
