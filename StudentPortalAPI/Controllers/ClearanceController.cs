using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentPortalAPI.Data;
using StudentPortalAPI.DTOs;

namespace StudentPortalAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClearanceController : ControllerBase
{
    private readonly AppDbContext _context;

    public ClearanceController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>Get clearance status for a session/semester</summary>
    [HttpGet]
    public async Task<IActionResult> GetClearance(
        [FromQuery] string? session,
        [FromQuery] string? semester)
    {
        var studentId = GetStudentId();
        var query = _context.ExamClearances.Where(ec => ec.StudentId == studentId);

        if (!string.IsNullOrEmpty(session))
            query = query.Where(ec => ec.Session == session);
        if (!string.IsNullOrEmpty(semester))
            query = query.Where(ec => ec.Semester == semester);

        var clearances = await query.Select(ec => new ClearanceDto
        {
            Id = ec.Id,
            Session = ec.Session,
            Semester = ec.Semester,
            Status = ec.Status,
            FeesPaid = ec.FeesPaid,
            CoursesRegistered = ec.CoursesRegistered,
            ClearedAt = ec.ClearedAt
        }).ToListAsync();

        return Ok(clearances);
    }

    /// <summary>Request clearance for exam</summary>
    [HttpPost("request")]
    public async Task<IActionResult> RequestClearance(
        [FromQuery] string session,
        [FromQuery] string semester)
    {
        var studentId = GetStudentId();

        // Check if already exists
        var existing = await _context.ExamClearances
            .FirstOrDefaultAsync(ec => ec.StudentId == studentId && ec.Session == session && ec.Semester == semester);

        if (existing != null)
            return BadRequest(new { message = "Clearance request already exists" });

        // Check prerequisites
        var feesPaid = await _context.Payments
            .AnyAsync(p => p.StudentId == studentId && p.Session == session && p.Status == "Completed");

        var coursesRegistered = await _context.CourseRegistrations
            .AnyAsync(cr => cr.StudentId == studentId && cr.Session == session && cr.Semester == semester);

        var clearance = new Models.ExamClearance
        {
            StudentId = studentId,
            Session = session,
            Semester = semester,
            FeesPaid = feesPaid,
            CoursesRegistered = coursesRegistered,
            Status = (feesPaid && coursesRegistered) ? "Cleared" : "Pending",
            ClearedAt = (feesPaid && coursesRegistered) ? DateTime.UtcNow : null
        };

        _context.ExamClearances.Add(clearance);
        await _context.SaveChangesAsync();

        return Ok(new ClearanceDto
        {
            Id = clearance.Id,
            Session = clearance.Session,
            Semester = clearance.Semester,
            Status = clearance.Status,
            FeesPaid = clearance.FeesPaid,
            CoursesRegistered = clearance.CoursesRegistered,
            ClearedAt = clearance.ClearedAt
        });
    }

    private int GetStudentId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(claim!.Value);
    }
}
