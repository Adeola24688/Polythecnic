using System.ComponentModel.DataAnnotations;

namespace StudentPortalAPI.Models;

public class Result
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;

    [Required]
    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public double Score { get; set; }

    [MaxLength(2)]
    public string Grade { get; set; } = string.Empty;

    public double GradePoint { get; set; }

    [Required, MaxLength(20)]
    public string Session { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Semester { get; set; } = string.Empty;
}
