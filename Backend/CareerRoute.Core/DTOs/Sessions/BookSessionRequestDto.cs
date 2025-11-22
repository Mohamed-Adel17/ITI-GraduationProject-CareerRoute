using CareerRoute.Core.Domain.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Sessions
{
    public class BookSessionRequestDto
    {

        public string TimeSlotId { get; set; }
        public string? Topic { get; set; }
        public string? Notes { get; set; }

    }
}

