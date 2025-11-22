using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Sessions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Mappings
{
    public class SessionProfile : Profile
    {
        public SessionProfile()
        {
            CreateMap<BookSessionRequestDto, Session>();

            CreateMap<Session, BookSessionResponseDto>()
               .ForMember(dest => dest.MenteeFirstName, opt => opt.MapFrom(src => src.Mentee.FirstName))
               .ForMember(dest => dest.MenteeLastName, opt => opt.MapFrom(src => src.Mentee.LastName))
               .ForMember(dest => dest.MentorFirstName, opt => opt.MapFrom(src => src.Mentor.User.FirstName))
               .ForMember(dest => dest.MentorLastName, opt => opt.MapFrom(src => src.Mentor.User.LastName));


            CreateMap<Session, SessionDetailsResponseDto>()
                .ForMember(dest => dest.MenteeFirstName, opt => opt.MapFrom(src => src.Mentee.FirstName))
                .ForMember(dest => dest.MenteeLastName, opt => opt.MapFrom(src => src.Mentee.LastName))
                .ForMember(dest => dest.MenteeProfilePictureUrl, opt => opt.MapFrom(src => src.Mentee.ProfilePictureUrl))
                .ForMember(dest => dest.MentorFirstName, opt => opt.MapFrom(src => src.Mentor.User.FirstName))
                .ForMember(dest => dest.MentorLastName, opt => opt.MapFrom(src => src.Mentor.User.LastName))
                .ForMember(dest => dest.MentorProfilePictureUrl, opt => opt.MapFrom(src => src.Mentor.User.ProfilePictureUrl))
                // Enums → String Otherwise Will Be int
                .ForMember(dest => dest.SessionType, opt => opt.MapFrom(src => src.SessionType.ToString()))
                .ForMember(dest => dest.Duration, opt => opt.MapFrom(src => src.Duration.ToString()))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.PaymentStatus, opt => opt.MapFrom(src => src.Payment.Status.ToString()))
               // Computed fields
               .ForMember(dest => dest.CanReschedule, opt => opt.MapFrom(src => (src.ScheduledStartTime - DateTime.UtcNow).TotalHours > 24 && src.Status == SessionStatusOptions.Confirmed))
               .ForMember(dest => dest.CanCancel, opt => opt.MapFrom(src => src.Status == SessionStatusOptions.Confirmed && src.CompletedAt == null));


            CreateMap<Session, UpCommingSessionItemResponseDto>()
                .ForMember(dest => dest.MenteeId, opt => opt.MapFrom(src => src.MenteeId))
                .ForMember(dest => dest.MenteeFirstName, opt => opt.MapFrom(src => src.Mentee.FirstName))
                .ForMember(dest => dest.MenteeLastName, opt => opt.MapFrom(src => src.Mentee.LastName))

                .ForMember(dest => dest.MentorId, opt => opt.MapFrom(src => src.MentorId))
                .ForMember(dest => dest.MentorFirstName, opt => opt.MapFrom(src => src.Mentor.User.FirstName))
                .ForMember(dest => dest.MentorLastName, opt => opt.MapFrom(src => src.Mentor.User.LastName))
                .ForMember(dest => dest.MentorProfilePictureUrl, opt => opt.MapFrom(src => src.Mentor.User.ProfilePictureUrl))

                // Enum to String Mappings
                .ForMember(dest => dest.SessionType, opt => opt.MapFrom(src => src.SessionType.ToString()))
                .ForMember(dest => dest.Duration, opt => opt.MapFrom(src => src.Duration.ToString()))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));


            CreateMap<Session, PastSessionItemResponseDto >()  
                .ForMember(dest => dest.MenteeFirstName, opt => opt.MapFrom(src => src.Mentee.FirstName))
                .ForMember(dest => dest.MenteeLastName, opt => opt.MapFrom(src => src.Mentee.LastName))
                .ForMember(dest => dest.MentorFirstName,opt => opt.MapFrom(src => src.Mentor.User.FirstName))
                .ForMember(dest => dest.MentorLastName,opt => opt.MapFrom(src => src.Mentor.User.LastName))
                .ForMember(dest => dest.MentorProfilePictureUrl, opt => opt.MapFrom(src => src.Mentor.User.ProfilePictureUrl))

                .ForMember(dest => dest.SessionType,opt => opt.MapFrom(src => src.SessionType.ToString()))
                .ForMember(dest => dest.Duration,opt => opt.MapFrom(src => src.Duration.ToString()))
                .ForMember(dest => dest.Status,opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.HasReview, opt => opt.MapFrom(src => src.Review != null));


            CreateMap<RescheduleSessionRequestDto, RescheduleSession>() 
                .ForMember(dest => dest.ReschudelReason, opt => opt.MapFrom(src => src.Reason));


            CreateMap<RescheduleSession, RescheduleSessionResponseDto>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.RequestedStartTime, opt => opt.MapFrom(src => src.NewScheduledStartTime));


            CreateMap<CancelSessionRequestDto, CancelSession>();

            CreateMap<CancelSession, CancelSessionResponseDto>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.RefundStatus, opt => opt.MapFrom(src => src.RefundStatus.ToString()));

            CreateMap<Session, JoinSessionResponseDto>()
                .ForMember(dest => dest.SessionId, opt => opt.MapFrom(src => src.Id));

            CreateMap<Session,CompleteSessionResponseDto>()
                .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()))
                .ForMember(d => d.Duration, opt => opt.MapFrom(s => s.Duration.ToString()))
                .ForMember(d => d.PaymentReleaseDate,  opt => opt.MapFrom(s => s.Payment.PaymentReleaseDate));

        }
    }
}
