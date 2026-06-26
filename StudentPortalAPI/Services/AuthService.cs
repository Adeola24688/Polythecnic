using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StudentPortalAPI.Data;
using StudentPortalAPI.DTOs;
using StudentPortalAPI.Models;

namespace StudentPortalAPI.Services;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var student = await _context.Students
            .FirstOrDefaultAsync(s => s.Email.ToLower() == dto.Email.ToLower());

        if (student == null || !BCrypt.Net.BCrypt.Verify(dto.Password, student.PasswordHash))
            return null;

        var token = GenerateJwtToken(student);
        return new AuthResponseDto
        {
            Token = token,
            Student = MapToDto(student)
        };
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
    {
        // Check if email or matric already exists
        if (await _context.Students.AnyAsync(s => s.Email.ToLower() == dto.Email.ToLower()))
            return null;

        if (await _context.Students.AnyAsync(s => s.MatricNumber == dto.MatricNumber))
            return null;

        var student = new Student
        {
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            MiddleName = dto.MiddleName,
            MatricNumber = dto.MatricNumber,
            Department = dto.Department,
            Faculty = dto.Faculty,
            Level = dto.Level,
            Phone = dto.Phone,
            Gender = dto.Gender,
            Session = "2024/2025",
            Semester = "First"
        };

        _context.Students.Add(student);
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(student);
        return new AuthResponseDto
        {
            Token = token,
            Student = MapToDto(student)
        };
    }

    public async Task<StudentDto?> GetProfileAsync(int studentId)
    {
        var student = await _context.Students.FindAsync(studentId);
        return student == null ? null : MapToDto(student);
    }

    public async Task<bool> ChangePasswordAsync(int studentId, ChangePasswordDto dto)
    {
        var student = await _context.Students.FindAsync(studentId);
        if (student == null) return false;

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, student.PasswordHash))
            return false;

        student.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        student.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<StudentDto?> UpdateBiodataAsync(int studentId, UpdateBiodataDto dto)
    {
        var student = await _context.Students.FindAsync(studentId);
        if (student == null) return null;

        if (dto.Phone != null) student.Phone = dto.Phone;
        if (dto.Gender != null) student.Gender = dto.Gender;
        if (dto.DateOfBirth != null) student.DateOfBirth = dto.DateOfBirth;
        if (dto.StateOfOrigin != null) student.StateOfOrigin = dto.StateOfOrigin;
        if (dto.LGA != null) student.LGA = dto.LGA;
        if (dto.Address != null) student.Address = dto.Address;
        if (dto.ProfilePhoto != null) student.ProfilePhoto = dto.ProfilePhoto;
        student.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDto(student);
    }

    private string GenerateJwtToken(Student student)
    {
        var jwtKey = _config["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT key is not configured. Set Jwt__Key in the environment.");

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, student.Id.ToString()),
            new Claim(ClaimTypes.Email, student.Email),
            new Claim("MatricNumber", student.MatricNumber),
            new Claim(ClaimTypes.Name, $"{student.FirstName} {student.LastName}")
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "StudentPortalAPI",
            audience: _config["Jwt:Audience"] ?? "StudentPortalApp",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static StudentDto MapToDto(Student student) => new()
    {
        Id = student.Id,
        MatricNumber = student.MatricNumber,
        Email = student.Email,
        FirstName = student.FirstName,
        LastName = student.LastName,
        MiddleName = student.MiddleName,
        Department = student.Department,
        Faculty = student.Faculty,
        Level = student.Level,
        Session = student.Session,
        Semester = student.Semester,
        Phone = student.Phone,
        Gender = student.Gender,
        DateOfBirth = student.DateOfBirth,
        StateOfOrigin = student.StateOfOrigin,
        LGA = student.LGA,
        Address = student.Address,
        ProfilePhoto = student.ProfilePhoto
    };
}
