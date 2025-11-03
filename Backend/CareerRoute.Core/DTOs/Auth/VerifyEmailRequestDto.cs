using CareerRoute.Core.Constants;
using System.ComponentModel.DataAnnotations;


namespace CareerRoute.Core.DTOs.Auth
{
    public class VerifyEmailRequestDto
    {
        public required string Email { get; set; }
        [Required]
        public required string Token { get; set; }


    }
}
