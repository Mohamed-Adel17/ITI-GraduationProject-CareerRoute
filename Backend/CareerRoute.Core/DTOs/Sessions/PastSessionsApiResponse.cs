using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Sessions
{
    public class PastSessionsApiResponse
    {
        public List<PastSessionsResponseDto> Sessions { get; set; }
        public PaginationDto Pagination { get; set; }
    }
}
