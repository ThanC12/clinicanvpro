using ClinicaProNV.Domain.Entities;
using ClinicaProNV.Domain.Pharmacy;
using ClinicaProNV.Domain.Billing;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProNV.Infrastructure.Persistence.Context;

public class ClinicaProNVDbContext : DbContext
{
    public ClinicaProNVDbContext(DbContextOptions<ClinicaProNVDbContext> options)
        : base(options) { }


        





    // ================= AUTH =================
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();

    // ================= CORE =================
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<ClinicalNote> ClinicalNotes => Set<ClinicalNote>();

    // ================= PHARMACY =================
    public DbSet<Medicine> Medicines => Set<Medicine>();
    public DbSet<PharmacyInvoice> PharmacyInvoices => Set<PharmacyInvoice>();
    public DbSet<PharmacyInvoiceDetail> PharmacyInvoiceDetails => Set<PharmacyInvoiceDetail>();

    // ================= BILLING =================
    public DbSet<ClinicInvoice> ClinicInvoices => Set<ClinicInvoice>();
    public DbSet<ClinicInvoiceDetail> ClinicInvoiceDetails => Set<ClinicInvoiceDetail>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // USER
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Email).IsRequired();
            e.Property(x => x.PasswordHash).IsRequired();
        });

        // ROLE
        modelBuilder.Entity<Role>(e =>
        {
            e.HasIndex(x => x.Name).IsUnique();
            e.Property(x => x.Name).IsRequired();
        });

        // USER ROLE
        modelBuilder.Entity<UserRole>(e =>
        {
            e.HasKey(x => new { x.UserId, x.RoleId });

            e.HasOne(x => x.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(x => x.UserId);

            e.HasOne(x => x.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(x => x.RoleId);
        });
    }
}
