using CareerRoute.Core.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CareerRoute.Core.DTOs.Sessions
{
    public class PastSessionsQueryDto
    {
        [Range(1, int.MaxValue)]
        public int Page { get; set; } = 1;

        [Range(1, 50)]
        public int PageSize { get; set; } = 10;

        /// <summary>
        /// Optional filter by session status (Completed or Cancelled)
        /// </summary>
        public SessionStatusOptions? Status { get; set; }
    }
}
