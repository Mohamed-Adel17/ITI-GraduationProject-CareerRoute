
using FluentValidation;

namespace CareerRoute.Core.Extensions
{
    public static class ValidationExtensions
    {
        public static async Task ValidateAsync<T>(this IValidator<T> validator, T instance)
        {
            var result = await validator.ValidateAsync(instance);

            if (!result.IsValid)
            {
                var errors = result.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).ToArray()
                    );

                throw new Exceptions.ValidationException(errors);
            }
        }
    }
}
