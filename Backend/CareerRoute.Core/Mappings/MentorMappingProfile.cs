using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.DTOs.Mentors;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Mappings
{
    public class MentorMappingProfile : Profile
    {
        public MentorMappingProfile()
        {
            CreateMap<Mentor, MentorProfileDto>()
                .ForMember(dest => dest.FirstName,
                opt => opt.MapFrom(src => src.User.FirstName))
                .ForMember(dest => dest.LastName,
                opt => opt.MapFrom(src => src.User.LastName))
                .ForMember(dest => dest.Email,
                    opt => opt.MapFrom(src => src.User.Email))
                .ForMember(dest => dest.ProfilePictureUrl,
                    opt => opt.MapFrom(src => src.User.ProfilePictureUrl))
                .ForMember(dest => dest.ExpertiseTags,
                    opt => opt.MapFrom(src => ConvertTagsToList(src.ExpertiseTags)));
        }
        // Helper: Convert comma-separated string → List<string>
        private static List<string> ConvertTagsToList(string? tags)
        {
            if (string.IsNullOrWhiteSpace(tags))
                return new List<string>();

            return tags.Split(',')
                .Select(tag => tag.Trim())
                .Where(tag => !string.IsNullOrEmpty(tag))
                .ToList();
        }
    }
}
