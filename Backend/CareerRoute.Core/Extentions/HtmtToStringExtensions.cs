
using System.Text.RegularExpressions;

namespace CareerRoute.Core.Extentions
{
    public static class HtmtToStringExtensions
    {
        public static string HtmlToString(this string html)
        {
            if (string.IsNullOrWhiteSpace(html))
                return string.Empty;

            return Regex.Replace(html, "<.*?>", string.Empty)   // Remove tags
                         .Replace("&nbsp;", " ")
                         .Trim();
        }
    }
}
