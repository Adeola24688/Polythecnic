using System.ComponentModel.DataAnnotations;

namespace StudentPortalAPI.Models;

public class Student
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string MatricNumber { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string LastName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? MiddleName { get; set; }

    [Required, MaxLength(100)]
    public string Department { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Faculty { get; set; }

    [Required, MaxLength(10)]
    public string Level { get; set; } = "100";

    [MaxLength(20)]
    public string? Session { get; set; }

    [MaxLength(20)]
    public string? Semester { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(10)]
    public string? Gender { get; set; }

    public DateTime? DateOfBirth { get; set; }

    [MaxLength(50)]
    public string? StateOfOrigin { get; set; }

    [MaxLength(50)]
    public string? LGA { get; set; }

    [MaxLength(200)]
    public string? Address { get; set; }

    [MaxLength(500)]
    public string? ProfilePhoto { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<CourseRegistration> CourseRegistrations { get; set; } = new List<CourseRegistration>();
    public ICollection<Result> Results { get; set; } = new List<Result>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<ExamClearance> ExamClearances { get; set; } = new List<ExamClearance>();
}
