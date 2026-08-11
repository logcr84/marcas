using System;
using System.Drawing;
using System.Threading.Tasks;
using System.Windows.Forms;
using Marcas.Agent.Worker.Services;

namespace Marcas.Agent.Worker.Forms;

/// <summary>
/// Ventana flotante que aparece al hacer clic en el ícono de la bandeja.
/// Permite registrar manualmente cualquier tipo de marca.
/// </summary>
public class FormMarcas : Form
{
    private readonly MarcaManualService _marcaService;
    private Label _lblEstado = null!;

    // Tipos de marca con su ID, ícono emoji y color
    private static readonly (byte Id, string Emoji, string Nombre, Color Color)[] TiposMarca =
    [
        (1, "🟢", "Entrada al Trabajo",     Color.FromArgb(34, 197, 94)),
        (2, "🟡", "Salida a Almuerzo",       Color.FromArgb(234, 179, 8)),
        (3, "🔵", "Regreso de Almuerzo",     Color.FromArgb(59, 130, 246)),
        (4, "🔴", "Salida del Trabajo",      Color.FromArgb(239, 68, 68)),
        (5, "⚪", "Pausa / Break Corto",     Color.FromArgb(156, 163, 175)),
        (6, "🟠", "Salida a Reunión",        Color.FromArgb(249, 115, 22)),
        (7, "🟣", "Regreso de Reunión",      Color.FromArgb(168, 85, 247)),
    ];

    public FormMarcas(MarcaManualService marcaService)
    {
        _marcaService = marcaService;
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        // ── Configuración del formulario ──────────────────────────────
        Text            = "Control de Marcas";
        FormBorderStyle = FormBorderStyle.FixedToolWindow;
        StartPosition   = FormStartPosition.Manual;
        ShowInTaskbar   = false;           // No aparece en la barra de tareas
        TopMost         = true;            // Siempre al frente
        BackColor       = Color.FromArgb(15, 23, 42);   // Azul muy oscuro (slate-900)
        Width           = 280;
        AutoSize        = true;
        AutoSizeMode    = AutoSizeMode.GrowAndShrink;
        Padding         = new Padding(16);

        // Posicionar cerca del reloj (esquina inferior derecha)
        var workArea = Screen.PrimaryScreen?.WorkingArea ?? new Rectangle(0, 0, 1920, 1080);
        Location = new Point(workArea.Right - Width - 12, workArea.Bottom - 430);

        // ── Panel principal ───────────────────────────────────────────
        var panel = new FlowLayoutPanel
        {
            FlowDirection = FlowDirection.TopDown,
            AutoSize      = true,
            AutoSizeMode  = AutoSizeMode.GrowAndShrink,
            WrapContents  = false,
            Dock          = DockStyle.Fill,
            BackColor     = Color.Transparent,
            Padding       = new Padding(0),
        };

        // ── Título ────────────────────────────────────────────────────
        var lblTitulo = new Label
        {
            Text      = "⏱  Registrar Marca",
            ForeColor = Color.White,
            Font      = new Font("Segoe UI", 11f, FontStyle.Bold),
            AutoSize  = true,
            Margin    = new Padding(0, 0, 0, 8),
        };
        panel.Controls.Add(lblTitulo);

        var separator = new Panel
        {
            Height    = 1,
            Width     = 248,
            BackColor = Color.FromArgb(51, 65, 85),
            Margin    = new Padding(0, 0, 0, 10),
        };
        panel.Controls.Add(separator);

        // ── Botones por cada tipo de marca ────────────────────────────
        foreach (var (id, emoji, nombre, color) in TiposMarca)
        {
            var btn = CrearBoton(emoji, nombre, color, id);
            panel.Controls.Add(btn);
        }

        // ── Separador ─────────────────────────────────────────────────
        var separator2 = new Panel
        {
            Height    = 1,
            Width     = 248,
            BackColor = Color.FromArgb(51, 65, 85),
            Margin    = new Padding(0, 6, 0, 6),
        };
        panel.Controls.Add(separator2);

        // ── Etiqueta de estado ────────────────────────────────────────
        _lblEstado = new Label
        {
            Text      = "Selecciona una opción para marcar.",
            ForeColor = Color.FromArgb(148, 163, 184),
            Font      = new Font("Segoe UI", 8f, FontStyle.Italic),
            AutoSize  = false,
            Width     = 248,
            Height    = 32,
            TextAlign = ContentAlignment.MiddleCenter,
        };
        panel.Controls.Add(_lblEstado);

        Controls.Add(panel);

        // Cerrar al perder el foco
        Deactivate += (s, e) => Close();
    }

    private Button CrearBoton(string emoji, string nombre, Color color, byte tipoMarcaId)
    {
        var btn = new Button
        {
            Text      = $"{emoji}  {nombre}",
            Width     = 248,
            Height    = 40,
            FlatStyle = FlatStyle.Flat,
            BackColor = Color.FromArgb(30, 41, 59),  // slate-800
            ForeColor = Color.White,
            Font      = new Font("Segoe UI", 9.5f),
            TextAlign = ContentAlignment.MiddleLeft,
            Padding   = new Padding(8, 0, 0, 0),
            Margin    = new Padding(0, 0, 0, 4),
            Cursor    = Cursors.Hand,
            Tag       = tipoMarcaId,
        };
        btn.FlatAppearance.BorderColor = Color.FromArgb(51, 65, 85);
        btn.FlatAppearance.BorderSize  = 1;

        // Hover: resaltar con el color del tipo de marca
        btn.MouseEnter += (s, e) =>
        {
            btn.BackColor = Color.FromArgb(
                Math.Min((int)color.R, 60),
                Math.Min((int)color.G, 80),
                Math.Min((int)color.B, 100));
            btn.FlatAppearance.BorderColor = color;
        };
        btn.MouseLeave += (s, e) =>
        {
            btn.BackColor = Color.FromArgb(30, 41, 59);
            btn.FlatAppearance.BorderColor = Color.FromArgb(51, 65, 85);
        };

        btn.Click += async (s, e) => await RegistrarMarca(tipoMarcaId, nombre);
        return btn;
    }

    private async Task RegistrarMarca(byte tipoMarcaId, string nombreTipo)
    {
        _lblEstado.ForeColor = Color.FromArgb(148, 163, 184);
        _lblEstado.Text      = "⏳ Registrando...";

        try
        {
            await _marcaService.RegistrarMarcaManualAsync(tipoMarcaId, $"Manual: {nombreTipo}");
            _lblEstado.ForeColor = Color.FromArgb(34, 197, 94);   // Verde
            _lblEstado.Text      = $"✅ {nombreTipo} registrada!";

            // Cerrar el formulario después de 1.5 segundos
            await Task.Delay(1500);
            Close();
        }
        catch (Exception ex)
        {
            _lblEstado.ForeColor = Color.FromArgb(239, 68, 68);   // Rojo
            _lblEstado.Text      = $"❌ Error: {ex.Message[..Math.Min(40, ex.Message.Length)]}";
        }
    }
}
