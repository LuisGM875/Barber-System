package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

type Sender interface {
	Send(to, subject, html string) error
}
type ResendSender struct{ APIKey, From string }

var resendHTTPClient = &http.Client{Timeout: 10 * time.Second}

func NewResendSender(apiKey, from string) Sender { return &ResendSender{APIKey: apiKey, From: from} }

func (sender *ResendSender) Send(to, subject, html string) error {
	if sender.APIKey == "" {
		log.Printf("[EMAIL DEV] Para: %s | Asunto: %s | Contenido: %s", to, subject, html)
		return nil
	}
	from := sender.From
	if from == "" {
		from = "BarberFlow <onboarding@resend.dev>"
	}
	body, _ := json.Marshal(map[string]any{"from": from, "to": []string{to}, "subject": subject, "html": html})
	request, err := http.NewRequest(http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return err
	}
	request.Header.Set("Authorization", "Bearer "+sender.APIKey)
	request.Header.Set("Content-Type", "application/json")
	response, err := resendHTTPClient.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		responseBody, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
		var resendError struct {
			Message string `json:"message"`
		}
		_ = json.Unmarshal(responseBody, &resendError)
		if response.StatusCode == http.StatusForbidden {
			return fmt.Errorf("Resend rechazó el envío: verifica que EMAIL_FROM use un dominio autorizado y que la API key tenga permiso de envío")
		}
		if response.StatusCode == http.StatusTooManyRequests {
			return fmt.Errorf("se alcanzó temporalmente el límite de correos; inténtalo más tarde")
		}
		if resendError.Message != "" {
			return fmt.Errorf("Resend no pudo enviar el correo: %s", resendError.Message)
		}
		return fmt.Errorf("Resend no pudo enviar el correo (estado %d)", response.StatusCode)
	}
	return nil
}
