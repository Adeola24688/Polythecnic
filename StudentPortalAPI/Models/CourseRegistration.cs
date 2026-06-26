using System.ComponentModel.DataAnnotations;

namespace StudentPortalAPI.Models;

public class CourseRegistration
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;

    [Required]
    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;

    [Required, MaxLength(20)]
    public string Session { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Semester { get; set; } = string.Empty;

    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
}
