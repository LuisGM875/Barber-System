package email

import (
	"fmt"
	"html"
)

func layout(preheader, title, body string) string {
	return fmt.Sprintf(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>%s</title></head>
<body style="margin:0;background:#111111;color:#f8f5f0;font-family:Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden">%s</div>
<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#111111;padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#1c1c1c;border:1px solid #303030;border-radius:18px;overflow:hidden">
<tr><td style="padding:24px 32px;border-bottom:1px solid #303030"><span style="display:inline-block;background:#c9a96e;color:#111111;border-radius:50%%;width:34px;height:34px;line-height:34px;text-align:center;font-weight:bold">✂</span><strong style="margin-left:10px;font-family:Georgia,serif;font-size:22px">BarberFlow</strong></td></tr>
<tr><td style="padding:34px 32px"><h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:30px;color:#f8f5f0">%s</h1>%s</td></tr>
<tr><td style="padding:20px 32px;background:#151515;color:#8f8f96;font-size:12px;text-align:center">Este correo fue enviado automáticamente por BarberFlow.</td></tr>
</table></td></tr></table></body></html>`, html.EscapeString(title), html.EscapeString(preheader), html.EscapeString(title), body)
}

func button(label, link string) string {
	return fmt.Sprintf(`<p style="margin:28px 0"><a href="%s" style="display:inline-block;background:#c9a96e;color:#111111;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:bold">%s</a></p>`, html.EscapeString(link), html.EscapeString(label))
}

func VerificationTemplate(name, link string) string {
	body := fmt.Sprintf(`<p style="color:#c7c7cc;line-height:1.7">Hola %s, confirma que este correo te pertenece para activar tu cuenta.</p>%s<p style="color:#8f8f96;font-size:13px;line-height:1.6">El enlace vence en 24 horas. Si tú no creaste esta cuenta, puedes ignorar este mensaje.</p>`, html.EscapeString(name), button("Verificar mi correo", link))
	return layout("Confirma tu correo para activar tu cuenta", "Verifica tu correo", body)
}

func PasswordResetTemplate(name, link string) string {
	body := fmt.Sprintf(`<p style="color:#c7c7cc;line-height:1.7">Hola %s, recibimos una solicitud para cambiar la contraseña de tu cuenta.</p>%s<p style="color:#8f8f96;font-size:13px;line-height:1.6">El enlace vence en 30 minutos y solo puede utilizarse una vez. Si no solicitaste el cambio, ignora este correo.</p>`, html.EscapeString(name), button("Crear nueva contraseña", link))
	return layout("Usa este enlace para crear una nueva contraseña", "Recupera tu contraseña", body)
}

type AppointmentDetails struct {
	Name, Service, Date, Time, Duration, Price, Notes, DashboardURL string
}

func AppointmentTemplate(details AppointmentDetails) string {
	notes := ""
	if details.Notes != "" {
		notes = fmt.Sprintf(`<tr><td style="padding:10px 0;color:#8f8f96">Notas</td><td style="padding:10px 0;text-align:right;color:#f8f5f0">%s</td></tr>`, html.EscapeString(details.Notes))
	}
	body := fmt.Sprintf(`<p style="color:#c7c7cc;line-height:1.7">Hola %s, tu cita fue agendada correctamente. Estos son los datos de tu reserva:</p><table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:#151515;border:1px solid #303030;border-radius:12px;padding:12px 20px"><tr><td style="padding:10px 0;color:#8f8f96">Servicio</td><td style="padding:10px 0;text-align:right;color:#f8f5f0;font-weight:bold">%s</td></tr><tr><td style="padding:10px 0;color:#8f8f96">Fecha</td><td style="padding:10px 0;text-align:right;color:#f8f5f0">%s</td></tr><tr><td style="padding:10px 0;color:#8f8f96">Hora</td><td style="padding:10px 0;text-align:right;color:#f8f5f0">%s</td></tr><tr><td style="padding:10px 0;color:#8f8f96">Duración</td><td style="padding:10px 0;text-align:right;color:#f8f5f0">%s</td></tr><tr><td style="padding:10px 0;color:#8f8f96">Precio</td><td style="padding:10px 0;text-align:right;color:#c9a96e;font-weight:bold">%s</td></tr>%s</table>%s<p style="color:#8f8f96;font-size:13px;line-height:1.6">Recuerda confirmar tu asistencia desde Mis citas cuando se habilite la confirmación.</p>`, html.EscapeString(details.Name), html.EscapeString(details.Service), html.EscapeString(details.Date), html.EscapeString(details.Time), html.EscapeString(details.Duration), html.EscapeString(details.Price), notes, button("Ver mis citas", details.DashboardURL))
	return layout("Tu cita fue agendada correctamente", "¡Tu cita está reservada!", body)
}
