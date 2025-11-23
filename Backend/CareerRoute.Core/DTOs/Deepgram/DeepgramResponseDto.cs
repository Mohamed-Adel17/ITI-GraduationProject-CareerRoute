using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace CareerRoute.Core.DTOs.Deepgram
{
    public class DeepgramResponseDto
    {
        [JsonPropertyName("results")]
        public DeepgramResults? Results { get; set; }
    }

    public class DeepgramResults
    {
        [JsonPropertyName("channels")]
        public List<DeepgramChannel>? Channels { get; set; }

        [JsonPropertyName("utterances")]
        public List<DeepgramUtterance>? Utterances { get; set; }
    }

    public class DeepgramChannel
    {
        [JsonPropertyName("alternatives")]
        public List<DeepgramAlternative>? Alternatives { get; set; }
    }

    public class DeepgramAlternative
    {
        [JsonPropertyName("transcript")]
        public string? Transcript { get; set; }
        
        [JsonPropertyName("confidence")]
        public double Confidence { get; set; }
    }

    public class DeepgramUtterance
    {
        [JsonPropertyName("speaker")]
        public int Speaker { get; set; }

        [JsonPropertyName("transcript")]
        public string? Transcript { get; set; }

        [JsonPropertyName("start")]
        public double Start { get; set; }

        [JsonPropertyName("end")]
        public double End { get; set; }

        [JsonPropertyName("confidence")]
        public double Confidence { get; set; }
    }
}
