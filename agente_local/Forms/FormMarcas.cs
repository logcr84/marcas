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

    // ──────────────────────────────────────────────────────────────────────────
    // MAPA CANÓNICO de tipos de marca — empleado público CR
    // Fuente de verdad: asistencia.TipoMarca en la BD (IDs fijos por IDENTITY).
    // ⚠️  NO reordenar sin actualizar también el seed SQL (02_procedures_y_seed).
    //
    //  ID  Código                  Base legal
    //   1  ENTRADA                 Art. 136 CT: inicio jornada
    //   2  SALIDA_CAFE_MANANA      Art. 138 CT: descanso mañana (15-20 min)
    //   3  REGRESO_CAFE_MANANA
    //   4  SALIDA_ALMUERZO         Art. 136 CT: tiempo de comida (máx. 1 h)
    //   5  REGRESO_ALMUERZO
    //   6  SALIDA_CAFE_TARDE       Art. 138 CT: descanso tarde (15-20 min)
    //   7  REGRESO_CAFE_TARDE
    //   8  SALIDA                  Fin de jornada
    //   9  SALIDA_COMISION         Art. 33 Ley 10159: comisión institucional
    //  10  REGRESO_COMISION
    //  11  SALIDA_MEDICA           Art. 79 CT: cita médica CCSS
    //  12  REGRESO_MEDICA
    // ──────────────────────────────────────────────────────────────────────────
    private static readonly (byte Id, string Codigo, string Emoji, string Nombre, string Detalle, Color Color)[] TiposMarca =
    [
        // ── Jornada principal ─────────────────────────────────────────────
        (1,  "ENTRADA",             "🟢", "Entrada al trabajo",        "Inicio de jornada laboral",          Color.FromArgb(34,  197, 94)),
        (8,  "SALIDA",              "🔴", "Salida del trabajo",         "Fin de jornada laboral",             Color.FromArgb(239, 68,  68)),

        // ── Café de mañana (Art. 138 CT) ──────────────────────────────────
        (2,  "SALIDA_CAFE_MANANA",  "☕", "Salida café — mañana",       "Descanso de mañana (~15-20 min)",   Color.FromArgb(180, 120, 60)),
        (3,  "REGRESO_CAFE_MANANA", "☕", "Regreso café — mañana",      "Regreso del descanso de mañana",    Color.FromArgb(120, 85,  45)),

        // ── Almuerzo (Art. 136 CT) ────────────────────────────────────────
        (4,  "SALIDA_ALMUERZO",     "🍽️","Salida a almuerzo",           "Tiempo de comida (máx. 1 hora)",   Color.FromArgb(234, 179, 8)),
        (5,  "REGRESO_ALMUERZO",    "🍽️","Regreso de almuerzo",         "Regreso del tiempo de comida",     Color.FromArgb(161, 123, 6)),

        // ── Café de tarde (Art. 138 CT) ───────────────────────────────────
        (6,  "SALIDA_CAFE_TARDE",   "☕", "Salida café — tarde",         "Descanso de tarde (~15-20 min)",   Color.FromArgb(180, 120, 60)),
        (7,  "REGRESO_CAFE_TARDE",  "☕", "Regreso café — tarde",        "Regreso del descanso de tarde",    Color.FromArgb(120, 85,  45)),

        // ── Comisión (Art. 33 Ley 10159) ─────────────────────────────────
        (9,  "SALIDA_COMISION",     "📋", "Salida en comisión",          "Asunto institucional fuera oficina",Color.FromArgb(99,  102, 241)),
        (10, "REGRESO_COMISION",    "📋", "Regreso de comisión",         "Regreso de diligencia institucional",Color.FromArgb(67, 70,  180)),

        // ── Médico CCSS (Art. 79 CT) ──────────────────────────────────────
        (11, "SALIDA_MEDICA",       "🏥", "Salida médica — CCSS",        "Cita médica autorizada (CCSS)",    Color.FromArgb(20,  184, 166)),
        (12, "REGRESO_MEDICA",      "🏥", "Regreso cita médica",         "Regreso de cita médica",           Color.FromArgb(15,  130, 115)),
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
        foreach (var (id, codigo, emoji, nombre, detalle, color) in TiposMarca)
        {
            var ctrl = CrearBoton(emoji, nombre, detalle, color, id, codigo);
            panel.Controls.Add(ctrl);
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

    protected override void OnShown(EventArgs e)
    {
        base.OnShown(e);
        
        // Posicionar cerca del reloj (esquina inferior derecha) de la pantalla donde esté el cursor
        // Se hace en OnShown para asegurar que el AutoSize ya calculó el Width/Height real con DPI Scaling.
        var workArea = Screen.FromPoint(Cursor.Position).WorkingArea;
        Location = new Point(workArea.Right - Width - 12, workArea.Bottom - Height - 12);
    }

    private Control CrearBoton(string emoji, string nombre, string detalle, Color color, byte tipoMarcaId, string codigo)
    {
        // Panel contenedor para nombre + subtítulo
        var container = new Panel
        {
            Width     = 248,
            Height    = 48,
            BackColor = Color.FromArgb(30, 41, 59),
            Margin    = new Padding(0, 0, 0, 4),
            Cursor    = Cursors.Hand,
            Tag       = tipoMarcaId,
        };

        // Barra de color lateral izquierda
        var barra = new Panel
        {
            Width     = 4,
            Height    = 48,
            Location  = new Point(0, 0),
            BackColor = color,
        };

        var lblNombre = new Label
        {
            Text      = $"{emoji}  {nombre}",
            ForeColor = Color.White,
            Font      = new Font("Segoe UI", 9.5f, FontStyle.Bold),
            Location  = new Point(12, 6),
            AutoSize  = false,
            Width     = 232,
            Height    = 18,
        };

        var lblDetalle = new Label
        {
            Text      = detalle,
            ForeColor = Color.FromArgb(148, 163, 184),
            Font      = new Font("Segoe UI", 7.5f, FontStyle.Regular),
            Location  = new Point(12, 26),
            AutoSize  = false,
            Width     = 232,
            Height    = 16,
        };

        container.Controls.AddRange([barra, lblNombre, lblDetalle]);

        // Hover en el contenedor y en sus labels
        void OnEnter(object? s, EventArgs e)
        {
            container.BackColor = Color.FromArgb(44, 55, 75);
            barra.BackColor     = color;
        }
        void OnLeave(object? s, EventArgs e)
        {
            container.BackColor = Color.FromArgb(30, 41, 59);
        }
        void OnClick(object? s, EventArgs e) =>
            _ = RegistrarMarca(tipoMarcaId, codigo, nombre);

        container.MouseEnter  += OnEnter;
        container.MouseLeave  += OnLeave;
        container.Click       += OnClick;
        lblNombre.MouseEnter  += OnEnter;
        lblNombre.MouseLeave  += OnLeave;
        lblNombre.Click       += OnClick;
        lblDetalle.MouseEnter += OnEnter;
        lblDetalle.MouseLeave += OnLeave;
        lblDetalle.Click      += OnClick;
        barra.Click           += OnClick;

        return container;   // FlowLayoutPanel acepta Control
    }

    private async Task RegistrarMarca(byte tipoMarcaId, string codigo, string nombreTipo)
    {
        _lblEstado.ForeColor = Color.FromArgb(148, 163, 184);
        _lblEstado.Text      = "⏳ Registrando...";

        try
        {
            // La observación incluye el código para facilitar diagnóstico en reportes
            await _marcaService.RegistrarMarcaManualAsync(tipoMarcaId, $"{codigo}: {nombreTipo}");
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
