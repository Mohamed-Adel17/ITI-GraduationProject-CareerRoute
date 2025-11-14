using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.DTOs.Skills;
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
                    opt => opt.MapFrom(src => src.User.UserSkills
                        .Where(us => us.Skill.IsActive)
                        .Select(us => new SkillDto
                        {
                            Id = us.Skill.Id,
                            Name = us.Skill.Name,
                            CategoryId = us.Skill.CategoryId,
                            CategoryName = us.Skill.Category.Name,
                            IsActive = us.Skill.IsActive
                        })
                        .ToList()));
        }
    }
}
