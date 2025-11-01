using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Mentors
{
    public class UpdateMentorProfileDto
    {
        [MaxLength(2000, ErrorMessage = "Bio cannot exceed 2000 characters.")]
        public string? Bio { get; set; }
        [MaxLength(500, ErrorMessage = "Expertise tags cannot exceed 500 characters.")]
        public List<string>? ExpertiseTags { get; set; }
        [Range(0, 60, ErrorMessage = "Years of experience must be between 0 and 60.")]
        public int? YearsOfExperience { get; set; }
        [MaxLength(1000, ErrorMessage = "Certifications cannot exceed 1000 characters.")]
        public string? Certifications { get; set; }
        [Range(1,200, ErrorMessage = "Rate for 30 minutes must be between 1 and 200.")]
        public decimal? Rate30Min { get; set; }
        [Range(1,400, ErrorMessage = "Rate for 60 minutes must be between 1 and 400.")]
        public decimal? Rate60Min { get; set; }
    }
}
