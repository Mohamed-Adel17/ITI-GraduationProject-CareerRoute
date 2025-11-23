using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Interfaces
{
    public  interface IRescheduleSessionService
    {
        Task HandlePendingRescheduleAsync(string rescheduleRequestId);

    }
}
