using System;
using System.IO;
using System.Windows.Forms;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Marcas.Agent.Worker.Data;
using Marcas.Agent.Worker.Services;
using Marcas.Agent.Worker;
using Serilog;

namespace Marcas.Agent.Worker;

static class Program
{
    [STAThread]
    static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();

        // Configurar Serilog para guardar logs en AppData/Local/MarcasAgent/logs/
        string logDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "MarcasAgent", "logs");
        Directory.CreateDirectory(logDir);
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .WriteTo.File(Path.Combine(logDir, "agente_.txt"), rollingInterval: RollingInterval.Day)
            .CreateLogger();

        Log.Information("Iniciando Agente de Marcas...");

        try
        {
            var builder = Host.CreateApplicationBuilder(args);

            // Integrar Serilog
            builder.Services.AddSerilog();

            // ── Sesión compartida: se llena tras el auto-login ────────────
            builder.Services.AddSingleton<AgentSession>();

            // ── Base de datos local SQLite ─────────────────────────────────
            builder.Services.AddSingleton<LocalDb>();

            // ── Servicio de marcas manuales (bandeja) ──────────────────────
            builder.Services.AddSingleton<MarcaManualService>();

            // ── HttpClient para SyncService ────────────────────────────────
            builder.Services.AddHttpClient<SyncService>();

            // ── Workers (Background Services) ─────────────────────────────
            builder.Services.AddHostedService<SyncService>();
            builder.Services.AddHostedService<ActivityMonitor>();

            var host = builder.Build();

            // ── Iniciar la bandeja del sistema ─────────────────────────────
            Application.Run(new TrayApplicationContext(host));
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "El agente cerró inesperadamente debido a una excepción no manejada.");
        }
        finally
        {
            Log.CloseAndFlush();
        }
    }
}
