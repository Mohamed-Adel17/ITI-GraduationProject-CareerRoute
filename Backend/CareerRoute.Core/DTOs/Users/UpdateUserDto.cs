using Microsoft.AspNetCore.Http;

namespace CareerRoute.Core.DTOs.Users
{
    public class UpdateUserDto 
    {
        //all fields optional to update 
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? CareerGoals { get; set; }
        public List<int>? CareerInterestIds { get; set; }
        public IFormFile? ProfilePicture { get; set; }

        //Excluded fields (require separate endpoints):
        // - UserName: Cannot be changed (login identifier)
        // - Email: Requires email verification flow
        // - Password: Requires current password validation
        // - Role: Admin-only operation
    }
}
