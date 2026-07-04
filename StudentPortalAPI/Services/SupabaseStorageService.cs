using System.Net.Http.Headers;

namespace StudentPortalAPI.Services;

public class SupabaseStorageService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    public SupabaseStorageService(IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    public async Task<string> UploadProfilePhotoAsync(int studentId, IFormFile file, CancellationToken cancellationToken = default)
    {
        var supabaseUrl = (_config["SUPABASE_URL"] ?? _config["Supabase:Url"])?.Trim() 
            ?? throw new InvalidOperationException("Supabase URL is not configured. Set SUPABASE_URL.");

        if (supabaseUrl.EndsWith("/storage/v1", StringComparison.OrdinalIgnoreCase))
        {
            supabaseUrl = supabaseUrl[..^"/storage/v1".Length];
        }

        supabaseUrl = supabaseUrl.TrimEnd('/');

        var serviceRoleKey = _config["SUPABASE_SERVICE_ROLE_KEY"] ?? _config["Supabase:ServiceRoleKey"]
            ?? throw new InvalidOperationException("Supabase service role key is not configured. Set SUPABASE_SERVICE_ROLE_KEY.");

        var bucket = (_config["SUPABASE_STORAGE_BUCKET"] ?? _config["Supabase:Storage:Bucket"] ?? "profile-photos")
            .Trim();

        if (string.IsNullOrEmpty(bucket) || bucket.Contains('/'))
            throw new InvalidOperationException("Supabase storage bucket name is not valid. Set SUPABASE_STORAGE_BUCKET to a valid bucket name.");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var objectPath = $"students/{studentId}/{Guid.NewGuid()}{extension}";

        using var stream = file.OpenReadStream();
        using var content = new StreamContent(stream);
        content.Headers.ContentType = MediaTypeHeaderValue.Parse(string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType);

        var requestUri = new Uri(new Uri(supabaseUrl, UriKind.Absolute), $"storage/v1/object/{Uri.EscapeDataString(bucket)}/{EncodePath(objectPath)}");
        var request = new HttpRequestMessage(HttpMethod.Post, requestUri)
        {
            Content = content
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
        request.Headers.Add("apikey", serviceRoleKey);
        request.Headers.Add("x-upsert", "true");

        var client = _httpClientFactory.CreateClient();
        var response = await client.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"Supabase Storage upload failed: {(int)response.StatusCode} {response.ReasonPhrase}. {responseBody}");
        }

        return $"{supabaseUrl}/storage/v1/object/public/{Uri.EscapeDataString(bucket)}/{EncodePath(objectPath)}";
    }

    private static string EncodePath(string path)
    {
        return string.Join('/', path.Split('/', StringSplitOptions.RemoveEmptyEntries).Select(Uri.EscapeDataString));
    }
}
