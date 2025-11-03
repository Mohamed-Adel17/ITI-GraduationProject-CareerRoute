using System.ComponentModel.DataAnnotations;

namespace CareerRoute.Core.DTOs.Mentors
{
    public class RejectMentorDto
    {
        [Required(ErrorMessage = "Rejection reason is required")]
        [MinLength(10, ErrorMessage = "Rejection reason must be at least 10 characters")]
        [MaxLength(500, ErrorMessage = "Rejection reason cannot exceed 500 characters")]
        public string Reason { get; set; } = string.Empty;
    }
}
