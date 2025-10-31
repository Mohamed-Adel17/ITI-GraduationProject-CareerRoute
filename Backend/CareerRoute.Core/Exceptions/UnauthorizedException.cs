using System;


namespace CareerRoute.Core.Exceptions
{
    public class UnauthorizedException :Exception
    {
        public UnauthorizedException(string message) : base(message) { }
    }
}
