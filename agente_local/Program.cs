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

        // Configurar base de datos local (SQLite)
        builder.Services.AddSingleton<LocalDb>();

        // Configurar HttpClient para SyncService
        builder.Services.AddHttpClient<SyncService>();

        // Registrar los Background Services (Workers)
        builder.Services.AddHostedService<ActivityMonitor>();
        builder.Services.AddHostedService<SyncService>();

        var host = builder.Build();

        // Iniciar la aplicación de Windows Forms con el icono en la bandeja
        Application.Run(new TrayApplicationContext(host));
    }
}
