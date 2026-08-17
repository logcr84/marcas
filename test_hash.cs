using System;
class Program {
    static void Main() {
        bool match = BCrypt.Net.BCrypt.Verify("Admin@2026!", "$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi");
        Console.WriteLine($"Match: {match}");
    }
}
