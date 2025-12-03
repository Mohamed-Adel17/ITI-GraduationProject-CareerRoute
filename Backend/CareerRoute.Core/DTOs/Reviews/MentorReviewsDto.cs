using CareerRoute.Core.DTOs.Sessions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Reviews
{
    public  class MentorReviewsDto
    {
        public List<ReviewDetailsItemDto> Reviews { get; set; } = [];
        public PaginationMetadataDto Pagination { get; set; } = new();
    }
}
