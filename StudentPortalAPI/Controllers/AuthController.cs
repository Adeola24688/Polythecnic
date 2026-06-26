using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentPortalAPI.DTOs;
using StudentPortalAPI.Services;

namespace StudentPortalAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        if (result == null)
            return Unauthorized(new { message = "Invalid email or password" });

        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await _authService.RegisterAsync(dto);
        if (result == null)
            return BadRequest(new { message = "Email or Matric Number already exists" });

        return Ok(result);
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var studentId = GetStudentId();
        var profile = await _authService.GetProfileAsync(studentId);
        if (profile == null) return NotFound();
        return Ok(profile);
    }

    [Authorize]
    [HttpPut("biodata")]
    public async Task<IActionResult> UpdateBiodata([FromBody] UpdateBiodataDto dto)
    {
        var studentId = GetStudentId();
        var result = await _authService.UpdateBiodataAsync(studentId, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var studentId = GetStudentId();
        var success = await _authService.ChangePasswordAsync(studentId, dto);
        if (!success)
            return BadRequest(new { message = "Current password is incorrect" });

        return Ok(new { message = "Password changed successfully" });
    }

    private int GetStudentId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(claim!.Value);
    }
}
