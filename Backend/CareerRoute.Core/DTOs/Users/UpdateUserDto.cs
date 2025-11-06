using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Users
{
    public class UpdateUserDto 
    {

        //all fields optional to update 
        public string? UserName { get; set; } 
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public string? CareerGoal { get; set; }
        public string? CareerInterst { get; set; }

        //Password , Role -> sensetive and will be updated using seprate endpoints 
    }
}
