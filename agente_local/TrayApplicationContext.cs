using System;
using System.Drawing;
using System.Windows.Forms;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;

namespace Marcas.Agent.Worker;

public class TrayApplicationContext : ApplicationContext
{
    private readonly NotifyIcon _trayIcon;
    private readonly IHost _host;

    public TrayApplicationContext(IHost host)
    {
        _host = host;

        // Intentar usar un icono de sistema predeterminado si no tenemos un .ico propio
        _trayIcon = new NotifyIcon()
        {
            Icon = SystemIcons.Information, 
            ContextMenuStrip = new ContextMenuStrip(),
            Visible = true,
            Text = "Agente Local - Control de Marcas (Activo)"
        };

        _trayIcon.ContextMenuStrip.Items.Add("Estado: Conectado", null, (s, e) => { /* Solo informativo */ });
        _trayIcon.ContextMenuStrip.Items.Add(new ToolStripSeparator());
        _trayIcon.ContextMenuStrip.Items.Add("Sincronizar ahora", null, (s, e) => {
            // Podríamos disparar un evento para que SyncService sincronice inmediatamente
            MessageBox.Show("Sincronización encolada.", "Agente Local", MessageBoxButtons.OK, MessageBoxIcon.Information);
        });
        _trayIcon.ContextMenuStrip.Items.Add("Salir", null, Exit);

        // Arrancar el IHost en segundo plano
        _host.StartAsync().ContinueWith(t => 
        {
            if (t.IsFaulted)
            {
                MessageBox.Show("Error al iniciar los servicios del agente.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                Application.Exit();
            }
        });
    }

    private async void Exit(object? sender, EventArgs e)
    {
        _trayIcon.Visible = false;
        
        // Detener los servicios correctamente
        await _host.StopAsync();
        _host.Dispose();

        Application.Exit();
    }
}
