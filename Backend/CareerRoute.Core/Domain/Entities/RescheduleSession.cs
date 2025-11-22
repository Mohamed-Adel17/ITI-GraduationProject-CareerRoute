using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Domain.Entities
{
    public class RescheduleSession
    {
        public string Id { get; set; }
        public SessionRescheduleOptions Status {get; set;}
        public DateTime OriginalStartTime { get; set; }
        public DateTime NewScheduledStartTime { get; set; }
        public string RequestedBy { get; set; }
        public string ReschudelReason { get; set; }
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public string SessionId { get; set; }
        public Session Session { get; set; }
    }
}
