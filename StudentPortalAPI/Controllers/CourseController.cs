using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentPortalAPI.Data;
using StudentPortalAPI.DTOs;
using StudentPortalAPI.Models;

namespace StudentPortalAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CourseController : ControllerBase
{
    private readonly AppDbContext _context;

    public CourseController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>Get all available courses, optionally filtered by department, level, semester</summary>
    [HttpGet("available")]
    public async Task<IActionResult> GetAvailableCourses(
        [FromQuery] string? department,
        [FromQuery] string? level,
        [FromQuery] string? semester)
    {
        var query = _context.Courses.AsQueryable();

        if (!string.IsNullOrEmpty(department))
            query = query.Where(c => c.Department == department);
        if (!string.IsNullOrEmpty(level))
            query = query.Where(c => c.Level == level);
        if (!string.IsNullOrEmpty(semester))
            query = query.Where(c => c.Semester == semester);

        var courses = await query.Select(c => new CourseDto
        {
            Id = c.Id,
            CourseCode = c.CourseCode,
            CourseTitle = c.CourseTitle,
            CreditUnit = c.CreditUnit,
            Department = c.Department,
            Level = c.Level,
            Semester = c.Semester
        }).ToListAsync();

        return Ok(courses);
    }

    /// <summary>Register selected courses for the current student</summary>
    [HttpPost("register")]
    public async Task<IActionResult> RegisterCourses([FromBody] RegisterCoursesDto dto)
    {
        var studentId = GetStudentId();

        // Check max credit unit (24 per semester)
        var existingCredits = await _context.CourseRegistrations
            .Where(cr => cr.StudentId == studentId && cr.Session == dto.Session && cr.Semester == dto.Semester)
            .SumAsync(cr => cr.Course.CreditUnit);

        var newCredits = await _context.Courses
            .Where(c => dto.CourseIds.Contains(c.Id))
            .SumAsync(c => c.CreditUnit);

        if (existingCredits + newCredits > 24)
            return BadRequest(new { message = $"Maximum credit units exceeded. You have {existingCredits} registered, adding {newCredits} would exceed the limit of 24." });

        var registrations = dto.CourseIds.Select(courseId => new CourseRegistration
        {
            StudentId = studentId,
            CourseId = courseId,
            Session = dto.Session,
            Semester = dto.Semester
        }).ToList();

        _context.CourseRegistrations.AddRange(registrations);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return BadRequest(new { message = "Some courses are already registered" });
        }

        return Ok(new { message = "Courses registered successfully", count = registrations.Count });
    }

    /// <summary>Get registered courses for the current student</summary>
    [HttpGet("registered")]
    public async Task<IActionResult> GetRegisteredCourses(
        [FromQuery] string? session,
        [FromQuery] string? semester)
    {
        var studentId = GetStudentId();
        var query = _context.CourseRegistrations
            .Include(cr => cr.Course)
            .Where(cr => cr.StudentId == studentId);

        if (!string.IsNullOrEmpty(session))
            query = query.Where(cr => cr.Session == session);
        if (!string.IsNullOrEmpty(semester))
            query = query.Where(cr => cr.Semester == semester);

        var registrations = await query.Select(cr => new CourseRegistrationDto
        {
            Id = cr.Id,
            CourseId = cr.CourseId,
            CourseCode = cr.Course.CourseCode,
            CourseTitle = cr.Course.CourseTitle,
            CreditUnit = cr.Course.CreditUnit,
            Session = cr.Session,
            Semester = cr.Semester,
            RegisteredAt = cr.RegisteredAt
        }).ToListAsync();

        return Ok(registrations);
    }

    /// <summary>Remove a course registration</summary>
    [HttpDelete("unregister/{registrationId}")]
    public async Task<IActionResult> UnregisterCourse(int registrationId)
    {
        var studentId = GetStudentId();
        var reg = await _context.CourseRegistrations
            .FirstOrDefaultAsync(cr => cr.Id == registrationId && cr.StudentId == studentId);

        if (reg == null) return NotFound();

        _context.CourseRegistrations.Remove(reg);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Course unregistered successfully" });
    }

    private int GetStudentId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(claim!.Value);
    }
}
