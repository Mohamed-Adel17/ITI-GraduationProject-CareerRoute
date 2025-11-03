using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Users
{
    internal class CreateUserDto
    {
        
        public string UserName { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; } 

        public string? PhoneNumber { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public string CareerGoal { get; set; }
        public string CareerInterst { get; set; }
        public string Role { get; set; } 
    }
}
