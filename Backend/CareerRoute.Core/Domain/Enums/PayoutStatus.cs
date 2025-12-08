using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Domain.Enums
{
    /// <summary>
    /// Represents the status of a mentor payout request
    /// </summary>
    public enum PayoutStatus
    {
        /// <summary>
        /// Payout request created, awaiting processing
        /// </summary>
        Pending,

        /// <summary>
        /// Payout is being processed
        /// </summary>
        Processing,

        /// <summary>
        /// Payout successfully completed
        /// </summary>
        Completed,

        /// <summary>
        /// Payout failed, amount restored to balance
        /// </summary>
        Failed,

        /// <summary>
        /// Payout cancelled by admin, amount restored
        /// </summary>
        Cancelled
    }
}
