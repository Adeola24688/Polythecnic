using System.ComponentModel.DataAnnotations;

namespace StudentPortalAPI.Models;

public class Payment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;

    [Required]
    public decimal Amount { get; set; }

    [Required, MaxLength(100)]
    public string Purpose { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Reference { get; set; }

    [Required, MaxLength(20)]
    public string Status { get; set; } = "Pending"; // Pending, Completed, Failed

    [Required, MaxLength(20)]
    public string Session { get; set; } = string.Empty;

    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
