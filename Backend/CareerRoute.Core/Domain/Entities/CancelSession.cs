using CareerRoute.Core.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Domain.Entities
{
    public  class CancelSession
    {
        public string Id { get; set; }
        public string CancelationReason { get; set; }
        public string CancelledBy { get; set; }
        public DateTime CancelledAt { get; set; }

        public string SessionId { get; set; }
        public Session Session { get; set; }

    }
}




