using System.ComponentModel.DataAnnotations;

namespace StudentPortalAPI.Models;

public class Course
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(10)]
    public string CourseCode { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string CourseTitle { get; set; } = string.Empty;

    [Required]
    public int CreditUnit { get; set; }

    [Required, MaxLength(100)]
    public string Department { get; set; } = string.Empty;

    [Required, MaxLength(10)]
    public string Level { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Semester { get; set; } = string.Empty;

    // Navigation properties
    public ICollection<CourseRegistration> CourseRegistrations { get; set; } = new List<CourseRegistration>();
    public ICollection<Result> Results { get; set; } = new List<Result>();
}
