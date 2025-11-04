using CareerRoute.Core.Constants;
using System.ComponentModel.DataAnnotations;


namespace CareerRoute.Core.DTOs.Auth
{
    public class VerifyEmailRequestDto
    {
        public string Email { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
    }
}
