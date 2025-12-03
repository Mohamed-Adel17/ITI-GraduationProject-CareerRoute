using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Reviews
{
    public class ReviewDetailsItemDto
    {

        public string Id { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        public string MentorId { get; set; } = null!;
        public string MentorFirstName { get; set; } = null!;
        public string MentorLastName { get; set; } = null!;


    }
}
