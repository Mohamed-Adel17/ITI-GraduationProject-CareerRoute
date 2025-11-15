using System;
using System.ComponentModel.DataAnnotations;
using System.Globalization;

namespace CareerRoute.Core.Domain.Entities
{
    public class TimeSlot
    {
        public string Id { get; set; }
        
        [MaxLength(450), Required]
        public required string MentorId { get; set; }
        
        public string? SessionId { get; set; }
        
        public DateTime StartDateTime { get; set; }
        
        public int DurationMinutes { get; set; }
        
        public bool IsBooked { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual Mentor Mentor { get; set; } = null!;
        public virtual Session? Session { get; set; }
    }
}
