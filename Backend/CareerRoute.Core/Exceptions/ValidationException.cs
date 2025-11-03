using System;


namespace CareerRoute.Core.Exceptions
{
    public class ValidationExceptionCustom:Exception
    {
        public IDictionary<string, string[]> Errors { get; }
        public ValidationExceptionCustom(IDictionary<string, string[]> errors)
            :base("One or more validation errors occurred")
        {
            Errors = errors;
        }
    }
}
