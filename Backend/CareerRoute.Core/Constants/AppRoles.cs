using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Constants
{
    public static class AppRoles
    {
        public const string User = "User";
        public const string Mentor = "Mentor";
        public const string Admin = "Admin";

        public static IEnumerable<string> GetAllRoles()
        {
           return new[] { User, Mentor, Admin };
        }
    }
}
