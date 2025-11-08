namespace CareerRoute.Core.DTOs.Users
{
    public class UpdateUserDto 
    {
        //all fields optional to update 
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public string? CareerGoal { get; set; }
        public string? CareerInterest { get; set; }

        //Excluded fields (require separate endpoints):
        // - UserName: Cannot be changed (login identifier)
        // - Email: Requires email verification flow
        // - Password: Requires current password validation
        // - Role: Admin-only operation
    }
}
