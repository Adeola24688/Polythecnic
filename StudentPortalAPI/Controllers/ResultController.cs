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
public class ResultController : ControllerBase
{
    private readonly AppDbContext _context;

    public ResultController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>Get results for a specific session/semester</summary>
    [HttpGet]
    public async Task<IActionResult> GetResults(
        [FromQuery] string? session,
        [FromQuery] string? semester)
    {
        var studentId = GetStudentId();
        var query = _context.Results
            .Include(r => r.Course)
            .Where(r => r.StudentId == studentId);

        if (!string.IsNullOrEmpty(session))
            query = query.Where(r => r.Session == session);
        if (!string.IsNullOrEmpty(semester))
            query = query.Where(r => r.Semester == semester);

        var results = await query.Select(r => new ResultDto
        {
            Id = r.Id,
            CourseCode = r.Course.CourseCode,
            CourseTitle = r.Course.CourseTitle,
            CreditUnit = r.Course.CreditUnit,
            Score = r.Score,
            Grade = r.Grade,
            GradePoint = r.GradePoint,
            Session = r.Session,
            Semester = r.Semester
        }).ToListAsync();

        return Ok(results);
    }

    /// <summary>Get result summary with GPA and CGPA</summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetResultSummary(
        [FromQuery] string session,
        [FromQuery] string semester)
    {
        var studentId = GetStudentId();

        // Current semester results
        var semesterResults = await _context.Results
            .Include(r => r.Course)
            .Where(r => r.StudentId == studentId && r.Session == session && r.Semester == semester)
            .ToListAsync();

        var resultDtos = semesterResults.Select(r => new ResultDto
        {
            Id = r.Id,
            CourseCode = r.Course.CourseCode,
            CourseTitle = r.Course.CourseTitle,
            CreditUnit = r.Course.CreditUnit,
            Score = r.Score,
            Grade = r.Grade,
            GradePoint = r.GradePoint,
            Session = r.Session,
            Semester = r.Semester
        }).ToList();

        // Calculate GPA for this semester
        var totalCreditUnits = semesterResults.Sum(r => r.Course.CreditUnit);
        var totalGradePoints = semesterResults.Sum(r => r.GradePoint * r.Course.CreditUnit);
        var gpa = totalCreditUnits > 0 ? totalGradePoints / totalCreditUnits : 0;

        // Calculate CGPA (all results)
        var allResults = await _context.Results
            .Include(r => r.Course)
            .Where(r => r.StudentId == studentId)
            .ToListAsync();

        var totalAllCredits = allResults.Sum(r => r.Course.CreditUnit);
        var totalAllGradePoints = allResults.Sum(r => r.GradePoint * r.Course.CreditUnit);
        var cgpa = totalAllCredits > 0 ? totalAllGradePoints / totalAllCredits : 0;

        return Ok(new ResultSummaryDto
        {
            Session = session,
            Semester = semester,
            Results = resultDtos,
            GPA = Math.Round(gpa, 2),
            CGPA = Math.Round(cgpa, 2),
            TotalCreditUnits = totalCreditUnits,
            TotalCreditPoints = (int)totalGradePoints
        });
    }

    private int GetStudentId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(claim!.Value);
    }
}
