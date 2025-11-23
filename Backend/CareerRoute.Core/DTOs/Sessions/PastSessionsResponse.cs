using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Sessions
{
    public class PastSessionsResponse
    {
        public List<PastSessionItemResponseDto> Sessions { get; set; } = [];
        public PaginationMetadataDto Pagination { get; set; } = new();
    }
}
