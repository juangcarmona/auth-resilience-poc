public sealed class WeatherRecomputeRequest
{
    public int? Days { get; init; }
    public string? Resolution { get; init; }   // low | medium | high
    public string? Model { get; init; }         // standard | experimental

    public bool HasAdvancedOptions =>
        Days.HasValue || Resolution is not null || Model is not null;
}
