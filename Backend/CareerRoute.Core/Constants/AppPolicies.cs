using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Constants
{
    public static class AppPolicies
    {
        //single-role policies
        public const string RequireUserRole = "RequireUserRole";
        public const string RequireMentorRole = "RequireMentorRole";
        public const string RequireAdminRole = "RequireAdminRole";

        //multi-role policies
        public const string RequireMentorOrAdminRole = "RequireMentorOrAdminRole";
        public const string RequireAnyRole = "RequireAnyRole";
    }
}
