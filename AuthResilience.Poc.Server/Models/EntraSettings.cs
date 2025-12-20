public sealed class EntraSettings
{
    public string TenantId { get; init; } = default!;
    public string ApiAudience { get; init; } = default!;

    public string Authority =>
        $"https://login.microsoftonline.com/{TenantId}/v2.0";
}
