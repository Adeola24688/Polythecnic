namespace StudentPortalAPI.DTOs;

// ─── Auth DTOs ───
public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string MatricNumber { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string? Faculty { get; set; }
    public string Level { get; set; } = "100";
    public string? Phone { get; set; }
    public string? Gender { get; set; }
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public StudentDto Student { get; set; } = null!;
}

public class ForgotPasswordDto
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

// ─── Student DTOs ───
public class StudentDto
{
    public int Id { get; set; }
    public string MatricNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string Department { get; set; } = string.Empty;
    public string? Faculty { get; set; }
    public string Level { get; set; } = string.Empty;
    public string? Session { get; set; }
    public string? Semester { get; set; }
    public string? Phone { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? StateOfOrigin { get; set; }
    public string? LGA { get; set; }
    public string? Address { get; set; }
    public string? ProfilePhoto { get; set; }
}

public class UpdateBiodataDto
{
    public string? Phone { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? StateOfOrigin { get; set; }
    public string? LGA { get; set; }
    public string? Address { get; set; }
    public string? ProfilePhoto { get; set; }
}

// ─── Course DTOs ───
public class CourseDto
{
    public int Id { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseTitle { get; set; } = string.Empty;
    public int CreditUnit { get; set; }
    public string Department { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public string Semester { get; set; } = string.Empty;
}

public class RegisterCoursesDto
{
    public List<int> CourseIds { get; set; } = new();
    public string Session { get; set; } = string.Empty;
    public string Semester { get; set; } = string.Empty;
}

public class CourseRegistrationDto
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseTitle { get; set; } = string.Empty;
    public int CreditUnit { get; set; }
    public string Session { get; set; } = string.Empty;
    public string Semester { get; set; } = string.Empty;
    public DateTime RegisteredAt { get; set; }
}

// ─── Result DTOs ───
public class ResultDto
{
    public int Id { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseTitle { get; set; } = string.Empty;
    public int CreditUnit { get; set; }
    public double Score { get; set; }
    public string Grade { get; set; } = string.Empty;
    public double GradePoint { get; set; }
    public string Session { get; set; } = string.Empty;
    public string Semester { get; set; } = string.Empty;
}

public class ResultSummaryDto
{
    public string Session { get; set; } = string.Empty;
    public string Semester { get; set; } = string.Empty;
    public List<ResultDto> Results { get; set; } = new();
    public double GPA { get; set; }
    public double CGPA { get; set; }
    public int TotalCreditUnits { get; set; }
    public int TotalCreditPoints { get; set; }
}

// ─── Payment DTOs ───
public class PaymentDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string Purpose { get; set; } = string.Empty;
    public string? Reference { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Session { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePaymentDto
{
    public decimal Amount { get; set; }
    public string Purpose { get; set; } = string.Empty;
    public string Session { get; set; } = string.Empty;
}

// ─── Clearance DTOs ───
public class ClearanceDto
{
    public int Id { get; set; }
    public string Session { get; set; } = string.Empty;
    public string Semester { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool FeesPaid { get; set; }
    public bool CoursesRegistered { get; set; }
    public DateTime? ClearedAt { get; set; }
}

// ─── Dashboard DTOs ───
public class DashboardDto
{
    public StudentDto Student { get; set; } = null!;
    public bool HasBiodata { get; set; }
    public bool HasRegisteredCourses { get; set; }
    public bool HasResults { get; set; }
    public string? ClearanceStatus { get; set; }
    public string? LatestPaymentStatus { get; set; }
    public List<string> Notices { get; set; } = new();
}
