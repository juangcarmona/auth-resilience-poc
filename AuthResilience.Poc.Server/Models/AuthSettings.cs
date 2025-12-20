public sealed class AuthSettings
{
    public string AuthMode { get; init; } = "normal";
    public bool DrEnabled { get; init; }
    public int DrMaxTtlMinutes { get; init; }
}
