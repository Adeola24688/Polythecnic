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
public class PaymentController : ControllerBase
{
    private readonly AppDbContext _context;

    public PaymentController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>Get all payments for the current student</summary>
    [HttpGet]
    public async Task<IActionResult> GetPayments([FromQuery] string? session)
    {
        var studentId = GetStudentId();
        var query = _context.Payments.Where(p => p.StudentId == studentId);

        if (!string.IsNullOrEmpty(session))
            query = query.Where(p => p.Session == session);

        var payments = await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PaymentDto
            {
                Id = p.Id,
                Amount = p.Amount,
                Purpose = p.Purpose,
                Reference = p.Reference,
                Status = p.Status,
                Session = p.Session,
                PaidAt = p.PaidAt,
                CreatedAt = p.CreatedAt
            }).ToListAsync();

        return Ok(payments);
    }

    /// <summary>Create a new payment record</summary>
    [HttpPost]
    public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentDto dto)
    {
        var studentId = GetStudentId();

        var payment = new Payment
        {
            StudentId = studentId,
            Amount = dto.Amount,
            Purpose = dto.Purpose,
            Session = dto.Session,
            Reference = $"PAY-{DateTime.UtcNow:yyyyMMddHHmmss}-{studentId}",
            Status = "Completed",
            PaidAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        return Ok(new PaymentDto
        {
            Id = payment.Id,
            Amount = payment.Amount,
            Purpose = payment.Purpose,
            Reference = payment.Reference,
            Status = payment.Status,
            Session = payment.Session,
            PaidAt = payment.PaidAt,
            CreatedAt = payment.CreatedAt
        });
    }

    private int GetStudentId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(claim!.Value);
    }
}
