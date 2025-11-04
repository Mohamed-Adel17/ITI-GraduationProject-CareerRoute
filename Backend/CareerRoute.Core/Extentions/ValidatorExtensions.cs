using FluentValidation;


namespace CareerRoute.Core.Extentions
{
    public static class ValidatorExtensions
    {
        public static async Task ValidateAndThrowAsync<T>(this IValidator<T> validator, T instance)
        {
            var validationResult = await validator.ValidateAsync(instance);
            if(!validationResult.IsValid)
            {
                var errors = validationResult.Errors
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
