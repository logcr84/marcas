using System;
using System.Windows.Forms;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Marcas.Agent.Worker.Data;
using Marcas.Agent.Worker.Services;
using Marcas.Agent.Worker;

namespace Marcas.Agent.Worker;

static class Program
{
    [STAThread]
    static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();

        var builder = Host.CreateApplicationBuilder(args);

        // ── Sesión compartida: se llena tras el auto-login ────────────
        builder.Services.AddSingleton<AgentSession>();

        // ── Base de datos local SQLite ─────────────────────────────────
        builder.Services.AddSingleton<LocalDb>();

        // ── Servicio de marcas manuales (bandeja) ──────────────────────
        builder.Services.AddSingleton<MarcaManualService>();

        // ── HttpClient para SyncService ────────────────────────────────
        builder.Services.AddHttpClient<SyncService>();

        // ── Workers (Background Services) ─────────────────────────────
        // SyncService arranca primero: autentica y llena AgentSession
        // ActivityMonitor espera a que AgentSession esté lista
        builder.Services.AddHostedService<SyncService>();
        builder.Services.AddHostedService<ActivityMonitor>();

        var host = builder.Build();

        // ── Iniciar la bandeja del sistema ─────────────────────────────
        Application.Run(new TrayApplicationContext(host));
    }
}
