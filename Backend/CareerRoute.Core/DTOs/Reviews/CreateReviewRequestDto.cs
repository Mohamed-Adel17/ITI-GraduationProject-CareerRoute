using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Reviews
{
    public class CreateReviewRequestDto
    {
      
            public int Rating { get; set; }

            public string? Comment { get; set; }
        

    }
}
