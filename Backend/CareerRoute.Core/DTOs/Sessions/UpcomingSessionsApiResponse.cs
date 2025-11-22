using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Sessions
{
    public class UpcomingSessionsApiResponse
    {
        public List<UpCommingSessionsResponseDto> Sessions { get; set; }
        public PaginationDto Pagination { get; set; }
    }
}
