namespace CareerRoute.Core.DTOs.Sessions;

public class GeneratePreparationResponseDto
{
    public string SessionId { get; set; } = null!;
    public string PreparationGuide { get; set; } = null!;
    public DateTime GeneratedAt { get; set; }
    public bool WasAlreadyGenerated { get; set; }
}
