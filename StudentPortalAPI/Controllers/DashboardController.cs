using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentPortalAPI.Data;
using StudentPortalAPI.DTOs;
using StudentPortalAPI.Services;

namespace StudentPortalAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var studentId = GetStudentId();
        var student = await _context.Students.FindAsync(studentId);
        if (student == null) return NotFound();

        var session = student.Session ?? "2024/2025";
        var semester = student.Semester ?? "First";

        var hasRegisteredCourses = await _context.CourseRegistrations
            .AnyAsync(cr => cr.StudentId == studentId && cr.Session == session && cr.Semester == semester);

        var hasResults = await _context.Results
            .AnyAsync(r => r.StudentId == studentId);

        var clearance = await _context.ExamClearances
            .FirstOrDefaultAsync(ec => ec.StudentId == studentId && ec.Session == session && ec.Semester == semester);

        var latestPayment = await _context.Payments
            .Where(p => p.StudentId == studentId)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();

        var hasBiodata = student.Phone != null || student.DateOfBirth != null;

        return Ok(new DashboardDto
        {
            Student = AuthService.MapToDto(student),
            HasBiodata = hasBiodata,
            HasRegisteredCourses = hasRegisteredCourses,
            HasResults = hasResults,
            ClearanceStatus = clearance?.Status,
            LatestPaymentStatus = latestPayment?.Status,
            Notices = new List<string>
            {
                "Welcome to the Student Portal",
                "Course registration for 2024/2025 session is now open",
                "Please complete your biodata for ID card generation"
            }
        });
    }

    private int GetStudentId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(claim!.Value);
    }
}
