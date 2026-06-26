using System.ComponentModel.DataAnnotations;

namespace StudentPortalAPI.Models;

public class ExamClearance
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;

    [Required, MaxLength(20)]
    public string Session { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Semester { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Status { get; set; } = "Pending"; // Pending, Cleared, Rejected

    public bool FeesPaid { get; set; }
    public bool CoursesRegistered { get; set; }

    public DateTime? ClearedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
