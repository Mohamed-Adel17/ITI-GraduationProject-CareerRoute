using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Infrastructure.Repositories
{
    public class TimeSlotRepository : GenericRepository<TimeSlot>, ITimeSlotRepository

    {
        public TimeSlotRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }


        public async Task<bool> IsAvailableTimeSlotAsync(string mentorId, DateTime newStart, int durationMinutes)
        {

            var newEnd = newStart.AddMinutes(durationMinutes);

            // Conflict exists if any timeslot (booked or free => Ignore is_booked filter) overlaps requested time
            
            bool hasConflict = await dbContext.TimeSlots.AnyAsync(t =>
                t.MentorId == mentorId &&
                (
                    t.StartDateTime < newEnd &&
                    newStart < t.StartDateTime.AddMinutes(t.DurationMinutes)
                )
            );

            return !hasConflict; // Available only if no timeslot overlaps
        }
    }


}
