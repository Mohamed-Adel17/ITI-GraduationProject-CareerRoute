using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.DTOs.Categories;

namespace CareerRoute.Core.Mappings
{
    public class CategoryMappingProfile : Profile
    {
        public CategoryMappingProfile()
        {
            CreateMap<Category, CategoryDto>()
                .ForMember(dest => dest.MentorCount, opt => opt.Ignore()); // Set manually when needed

            CreateMap<CreateCategoryDto, Category>();
        }
    }
}
