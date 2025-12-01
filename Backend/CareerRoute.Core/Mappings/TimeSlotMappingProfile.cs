using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.DTOs.TimeSlots;

namespace CareerRoute.Core.Mappings
{
    public class TimeSlotMappingProfile : Profile
    {
        public TimeSlotMappingProfile()
        {
            // TimeSlot -> TimeSlotDto
            CreateMap<TimeSlot, TimeSlotDto>()
                .ForMember(dest => dest.EndDateTime, 
                    opt => opt.MapFrom(src => src.StartDateTime.AddMinutes(src.DurationMinutes)))
                .ForMember(dest => dest.CanDelete, 
                    opt => opt.MapFrom(src => !src.IsBooked))
                .ForMember(dest => dest.Session, 
                    opt => opt.MapFrom(src => src.Session));

            // TimeSlot -> AvailableSlotDto (with price from mentor)
            CreateMap<TimeSlot, AvailableSlotDto>()
                .ForMember(dest => dest.EndDateTime, 
                    opt => opt.MapFrom(src => src.StartDateTime.AddMinutes(src.DurationMinutes)))
                .ForMember(dest => dest.Price, 
                    opt => opt.MapFrom(src => src.DurationMinutes == 30 
                        ? src.Mentor.Rate30Min 
                        : src.Mentor.Rate60Min));

            // Session -> SessionPreviewDto
            CreateMap<Session, SessionPreviewDto>()
                .ForMember(dest => dest.MenteeFirstName, 
                    opt => opt.MapFrom(src => src.Mentee.FirstName))
                .ForMember(dest => dest.MenteeLastName, 
                    opt => opt.MapFrom(src => src.Mentee.LastName))
                .ForMember(dest => dest.Status, 
                    opt => opt.MapFrom(src => src.Status.ToString()));
        }
    }
}
