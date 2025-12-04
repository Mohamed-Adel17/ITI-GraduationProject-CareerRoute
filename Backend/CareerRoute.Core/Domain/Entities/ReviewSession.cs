using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Domain.Entities
{
    public class ReviewSession
    {
        public string Id { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int Rating { get; set; }
        public string SessionId { get; set; }
        public Session Session { get; set; } = null!;


    }


}

