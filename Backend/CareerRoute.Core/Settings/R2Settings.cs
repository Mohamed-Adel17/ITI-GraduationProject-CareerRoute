namespace CareerRoute.Core.Settings
{
    public class R2Settings
    {
        public string AccountId { get; set; } = string.Empty;
        public string AccessKey { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public string BucketName { get; set; } = string.Empty;
        public string PublicUrl { get; set; } = string.Empty;
        
        // Folder paths for different file types
        public string RecordingsFolder { get; set; } = "recordings";
        public string CvsFolder { get; set; } = "cvs";
        public string ProfilePicturesFolder { get; set; } = "profile-pictures";
    }
}
