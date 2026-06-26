using Microsoft.EntityFrameworkCore;
using StudentPortalAPI.Models;

namespace StudentPortalAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Student> Students => Set<Student>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<CourseRegistration> CourseRegistrations => Set<CourseRegistration>();
    public DbSet<Result> Results => Set<Result>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<ExamClearance> ExamClearances => Set<ExamClearance>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Student
        modelBuilder.Entity<Student>(e =>
        {
            e.HasIndex(s => s.Email).IsUnique();
            e.HasIndex(s => s.MatricNumber).IsUnique();
        });

        // CourseRegistration — composite unique constraint
        modelBuilder.Entity<CourseRegistration>(e =>
        {
            e.HasIndex(cr => new { cr.StudentId, cr.CourseId, cr.Session, cr.Semester }).IsUnique();
            e.HasOne(cr => cr.Student).WithMany(s => s.CourseRegistrations).HasForeignKey(cr => cr.StudentId);
            e.HasOne(cr => cr.Course).WithMany(c => c.CourseRegistrations).HasForeignKey(cr => cr.CourseId);
        });

        // Result
        modelBuilder.Entity<Result>(e =>
        {
            e.HasIndex(r => new { r.StudentId, r.CourseId, r.Session, r.Semester }).IsUnique();
            e.HasOne(r => r.Student).WithMany(s => s.Results).HasForeignKey(r => r.StudentId);
            e.HasOne(r => r.Course).WithMany(c => c.Results).HasForeignKey(r => r.CourseId);
        });

        // Payment
        modelBuilder.Entity<Payment>(e =>
        {
            e.HasOne(p => p.Student).WithMany(s => s.Payments).HasForeignKey(p => p.StudentId);
        });

        // ExamClearance
        modelBuilder.Entity<ExamClearance>(e =>
        {
            e.HasIndex(ec => new { ec.StudentId, ec.Session, ec.Semester }).IsUnique();
            e.HasOne(ec => ec.Student).WithMany(s => s.ExamClearances).HasForeignKey(ec => ec.StudentId);
        });

        // Seed some sample courses
        modelBuilder.Entity<Course>().HasData(
            new Course { Id = 1, CourseCode = "COM111", CourseTitle = "Introduction to Computing", CreditUnit = 3, Department = "Computer Science", Level = "100", Semester = "First" },
            new Course { Id = 2, CourseCode = "COM112", CourseTitle = "Introduction to Programming", CreditUnit = 3, Department = "Computer Science", Level = "100", Semester = "First" },
            new Course { Id = 3, CourseCode = "MTH111", CourseTitle = "Elementary Mathematics I", CreditUnit = 3, Department = "Computer Science", Level = "100", Semester = "First" },
            new Course { Id = 4, CourseCode = "ENG111", CourseTitle = "Use of English I", CreditUnit = 2, Department = "Computer Science", Level = "100", Semester = "First" },
            new Course { Id = 5, CourseCode = "PHY111", CourseTitle = "General Physics I", CreditUnit = 3, Department = "Computer Science", Level = "100", Semester = "First" },
            new Course { Id = 6, CourseCode = "COM121", CourseTitle = "Computer Hardware", CreditUnit = 3, Department = "Computer Science", Level = "100", Semester = "Second" },
            new Course { Id = 7, CourseCode = "COM122", CourseTitle = "BASIC Programming", CreditUnit = 3, Department = "Computer Science", Level = "100", Semester = "Second" },
            new Course { Id = 8, CourseCode = "MTH121", CourseTitle = "Elementary Mathematics II", CreditUnit = 3, Department = "Computer Science", Level = "100", Semester = "Second" },
            new Course { Id = 9, CourseCode = "ENG121", CourseTitle = "Use of English II", CreditUnit = 2, Department = "Computer Science", Level = "100", Semester = "Second" },
            new Course { Id = 10, CourseCode = "STA121", CourseTitle = "Introduction to Statistics", CreditUnit = 3, Department = "Computer Science", Level = "100", Semester = "Second" },
            new Course { Id = 11, CourseCode = "SLT201", CourseTitle = "Science Laboratory Technology I", CreditUnit = 3, Department = "Science Laboratory Technology", Level = "200", Semester = "First" },
            new Course { Id = 12, CourseCode = "SLT202", CourseTitle = "Analytical Chemistry I", CreditUnit = 3, Department = "Science Laboratory Technology", Level = "200", Semester = "First" },
            new Course { Id = 13, CourseCode = "SLT203", CourseTitle = "Organic Chemistry I", CreditUnit = 3, Department = "Science Laboratory Technology", Level = "200", Semester = "First" },
            new Course { Id = 14, CourseCode = "SLT204", CourseTitle = "Microbiology I", CreditUnit = 3, Department = "Science Laboratory Technology", Level = "200", Semester = "First" },
            new Course { Id = 15, CourseCode = "SLT205", CourseTitle = "Biochemistry I", CreditUnit = 3, Department = "Science Laboratory Technology", Level = "200", Semester = "First" }
        );
    }
}
