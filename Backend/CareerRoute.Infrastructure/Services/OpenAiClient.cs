using System.Net.Http.Json;
using System.Text.Json;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Settings;
using Microsoft.Extensions.Options;

namespace CareerRoute.Infrastructure.Services;

public class OpenAiClient : IAiClient
{
    private readonly HttpClient _http;
    private const string Model = "gpt-4o-mini";

    public OpenAiClient(HttpClient http, IOptions<OpenAISettings> settings)
    {
        _http = http;
        _http.BaseAddress = new Uri("https://api.openai.com/v1/");
        _http.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", settings.Value.ApiKey);
    }

    public async Task<string> GetCompletionAsync(string systemPrompt, string userPrompt, CancellationToken ct = default)
    {
        var body = new
        {
            model = Model,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            }
        };

        var response = await _http.PostAsJsonAsync("chat/completions", body, ct);
        response.EnsureSuccessStatusCode();

        using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
        return doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
    }
}
