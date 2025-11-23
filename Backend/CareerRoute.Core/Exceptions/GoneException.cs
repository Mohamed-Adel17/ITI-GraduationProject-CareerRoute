using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Exceptions
{
    public class GoneException : Exception
    {
        public GoneException(string message) : base(message) { }

        public GoneException (string name, object key)
            : base($"{name} with id {key} was ended") { }
    
    }
}
