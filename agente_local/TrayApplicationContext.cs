using System;
using System.Drawing;
using System.Windows.Forms;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Marcas.Agent.Worker.Forms;
using Marcas.Agent.Worker.Services;

namespace Marcas.Agent.Worker;

public class TrayApplicationContext : ApplicationContext
{
    private readonly NotifyIcon _trayIcon;
    private readonly IHost _host;
    private readonly MarcaManualService _marcaManualService;
    private FormMarcas? _formMarcas;

    public TrayApplicationContext(IHost host)
    {
        _host = host;
        _marcaManualService = host.Services.GetRequiredService<MarcaManualService>();

        _trayIcon = new NotifyIcon
        {
            Icon        = SystemIcons.Information,
            Visible     = true,
            Text        = "Agente Marcas — Haz clic para registrar",
            ContextMenuStrip = BuildContextMenu(),
        };

        // Clic izquierdo: abrir la ventana de marcas
        _trayIcon.Click += (s, e) =>
        {
            if (e is MouseEventArgs me && me.Button == MouseButtons.Left)
                AbrirFormMarcas();
        };

        // Arrancar el host en segundo plano
        _host.StartAsync().ContinueWith(t =>
        {
            if (t.IsFaulted)
            {
                MessageBox.Show(
                    "Error al iniciar los servicios del agente:\n" + t.Exception?.InnerException?.Message,
                    "Agente Marcas — Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                Application.Exit();
            }
        });
    }

    // ── Menú contextual (clic derecho) ────────────────────────────────
    private ContextMenuStrip BuildContextMenu()
    {
        var menu = new ContextMenuStrip();
        menu.BackColor = Color.FromArgb(15, 23, 42);
        menu.ForeColor = Color.White;
        menu.Font      = new System.Drawing.Font("Segoe UI", 9f);

        // Accesos directos a marcas más comunes (terminología CR)
        menu.Items.Add("🟢  Entrada al trabajo",       null, async (s, e) => await _marcaManualService.RegistrarMarcaManualAsync(1,  "Manual: Entrada"));
        menu.Items.Add("☕  Salida café — mañana",      null, async (s, e) => await _marcaManualService.RegistrarMarcaManualAsync(2,  "Manual: Café mañana"));
        menu.Items.Add("☕  Regreso café — mañana",     null, async (s, e) => await _marcaManualService.RegistrarMarcaManualAsync(3,  "Manual: Regreso café mañana"));
        menu.Items.Add("🍽️  Salida a almuerzo",          null, async (s, e) => await _marcaManualService.RegistrarMarcaManualAsync(4,  "Manual: Almuerzo"));
        menu.Items.Add("🍽️  Regreso de almuerzo",        null, async (s, e) => await _marcaManualService.RegistrarMarcaManualAsync(5,  "Manual: Regreso almuerzo"));
        menu.Items.Add("☕  Salida café — tarde",        null, async (s, e) => await _marcaManualService.RegistrarMarcaManualAsync(6,  "Manual: Café tarde"));
        menu.Items.Add("☕  Regreso café — tarde",       null, async (s, e) => await _marcaManualService.RegistrarMarcaManualAsync(7,  "Manual: Regreso café tarde"));
        menu.Items.Add("🔴  Salida del trabajo",        null, async (s, e) => await _marcaManualService.RegistrarMarcaManualAsync(8,  "Manual: Salida"));
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("📋  Salida en comisión",        null, async (s, e) => await _marcaManualService.RegistrarMarcaManualAsync(9,  "Manual: Comisión"));
        menu.Items.Add("📋  Regreso de comisión",       null, async (s, e) => await _marcaManualService.RegistrarMarcaManualAsync(10, "Manual: Regreso comisión"));
        menu.Items.Add("🏥  Salida médica — CCSS",      null, async (s, e) => await _marcaManualService.RegistrarMarcaManualAsync(11, "Manual: Médico CCSS"));
        menu.Items.Add("🏥  Regreso cita médica",       null, async (s, e) => await _marcaManualService.RegistrarMarcaManualAsync(12, "Manual: Regreso médico"));
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("📋  Todas las opciones...",     null, (s, e) => AbrirFormMarcas());
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("ℹ  Estado: Activo",             null, (s, e) => { /* Informativo */ });
        menu.Items.Add("🔄  Sincronizar ahora",         null, (s, e) =>
            MessageBox.Show("El agente sincronizará en la próxima ronda automática (≤10 seg).",
                "Agente Marcas", MessageBoxButtons.OK, MessageBoxIcon.Information));
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("❌  Salir",                     null, Exit);

        return menu;
    }

    // ── Abrir formulario flotante ──────────────────────────────────────
    private void AbrirFormMarcas()
    {
        // Si ya está abierto, lo traemos al frente
        if (_formMarcas != null && !_formMarcas.IsDisposed)
        {
            _formMarcas.BringToFront();
            _formMarcas.Focus();
            return;
        }

        _formMarcas = new FormMarcas(_marcaManualService);
        _formMarcas.FormClosed += (s, e) => _formMarcas = null;
        _formMarcas.Show();
    }

    // ── Salir ────────────────────────────────────────────────────────
    private async void Exit(object? sender, EventArgs e)
    {
        _trayIcon.Visible = false;
        await _host.StopAsync();
        _host.Dispose();
        Application.Exit();
    }
}
