using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.DTOs.Categories;
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
                        .ToList()))
                .ForMember(dest => dest.Categories,
                    opt => opt.MapFrom(src => src.MentorCategories
                        .Select(mc => new CategoryDto
                        {
                            Id = mc.Category.Id,
                            Name = mc.Category.Name,
                            Description = mc.Category.Description,
                            IconUrl = mc.Category.IconUrl,
                            IsActive = mc.Category.IsActive,
                            CreatedAt = mc.Category.CreatedAt,
                            UpdatedAt = mc.Category.UpdatedAt
                        })
                        .ToList()))
                .ForMember(dest => dest.ResponseTime,
                    opt => opt.Ignore()) // Calculated separately if needed
                .ForMember(dest => dest.CompletionRate,
                    opt => opt.Ignore()) // Calculated separately if needed
                .ForMember(dest => dest.IsAvailable,
                    opt => opt.MapFrom(src => src.IsAvailable));
        }
    }
}
