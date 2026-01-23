package email

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
	"strings"
)

// Config represents email configuration
type Config struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
	FromName string
}

// Email represents an email message
type Email struct {
	To          []string
	Cc          []string
	Bcc         []string
	Subject     string
	Body        string
	HTMLBody    string
	Attachments []Attachment
}

// Attachment represents an email attachment
type Attachment struct {
	Filename string
	Content  []byte
}

// Sender interface
type Sender interface {
	Send(email *Email) error
}

// SMTPSender implements Sender using SMTP
type SMTPSender struct {
	config *Config
}

// NewSMTPSender creates a new SMTP sender
func NewSMTPSender(config *Config) Sender {
	return &SMTPSender{config: config}
}

// Send sends an email via SMTP
func (s *SMTPSender) Send(email *Email) error {
	auth := smtp.PlainAuth("", s.config.Username, s.config.Password, s.config.Host)
	
	addr := fmt.Sprintf("%s:%d", s.config.Host, s.config.Port)
	
	msg := s.buildMessage(email)
	
	return smtp.SendMail(addr, auth, s.config.From, email.To, []byte(msg))
}

// buildMessage builds email message
func (s *SMTPSender) buildMessage(email *Email) string {
	var buf bytes.Buffer
	
	// Headers
	buf.WriteString(fmt.Sprintf("From: %s <%s>\r\n", s.config.FromName, s.config.From))
	buf.WriteString(fmt.Sprintf("To: %s\r\n", strings.Join(email.To, ", ")))
	
	if len(email.Cc) > 0 {
		buf.WriteString(fmt.Sprintf("Cc: %s\r\n", strings.Join(email.Cc, ", ")))
	}
	
	buf.WriteString(fmt.Sprintf("Subject: %s\r\n", email.Subject))
	buf.WriteString("MIME-Version: 1.0\r\n")
	buf.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	buf.WriteString("\r\n")
	
	// Body
	if email.HTMLBody != "" {
		buf.WriteString(email.HTMLBody)
	} else {
		buf.WriteString(email.Body)
	}
	
	return buf.String()
}

// Template engine for emails
type TemplateEngine struct {
	templates map[string]*template.Template
}

// NewTemplateEngine creates a new template engine
func NewTemplateEngine() *TemplateEngine {
	return &TemplateEngine{
		templates: make(map[string]*template.Template),
	}
}

// Register registers a template
func (e *TemplateEngine) Register(name, content string) error {
	tmpl, err := template.New(name).Parse(content)
	if err != nil {
		return err
	}
	e.templates[name] = tmpl
	return nil
}

// Render renders a template
func (e *TemplateEngine) Render(name string, data interface{}) (string, error) {
	tmpl, ok := e.templates[name]
	if !ok {
		return "", fmt.Errorf("template not found: %s", name)
	}
	
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}
	
	return buf.String(), nil
}

// Common email templates
const (
	WelcomeTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome</title>
</head>
<body>
    <h1>Welcome {{.Name}}!</h1>
    <p>Thank you for joining our platform.</p>
    <p>Your account has been created successfully.</p>
</body>
</html>
`

	PasswordResetTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Password Reset</title>
</head>
<body>
    <h1>Password Reset Request</h1>
    <p>Hi {{.Name}},</p>
    <p>You requested to reset your password. Click the link below to reset it:</p>
    <p><a href="{{.ResetLink}}">Reset Password</a></p>
    <p>This link will expire in {{.ExpiryHours}} hours.</p>
    <p>If you didn't request this, please ignore this email.</p>
</body>
</html>
`

	VerificationTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Verification</title>
</head>
<body>
    <h1>Verify Your Email</h1>
    <p>Hi {{.Name}},</p>
    <p>Please verify your email address by clicking the link below:</p>
    <p><a href="{{.VerificationLink}}">Verify Email</a></p>
    <p>This link will expire in {{.ExpiryHours}} hours.</p>
</body>
</html>
`

	InvitationTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invitation</title>
</head>
<body>
    <h1>You're Invited!</h1>
    <p>Hi,</p>
    <p>{{.InviterName}} has invited you to join {{.TenantName}}.</p>
    <p><a href="{{.InvitationLink}}">Accept Invitation</a></p>
    <p>This invitation will expire in {{.ExpiryDays}} days.</p>
</body>
</html>
`
)

// Email builders
func NewWelcomeEmail(to, name string) *Email {
	return &Email{
		To:      []string{to},
		Subject: "Welcome to VHV Platform",
	}
}

func NewPasswordResetEmail(to, name, resetLink string) *Email {
	return &Email{
		To:      []string{to},
		Subject: "Password Reset Request",
	}
}

func NewVerificationEmail(to, name, verificationLink string) *Email {
	return &Email{
		To:      []string{to},
		Subject: "Verify Your Email Address",
	}
}

func NewInvitationEmail(to, inviterName, tenantName, invitationLink string) *Email {
	return &Email{
		To:      []string{to},
		Subject: fmt.Sprintf("Invitation to join %s", tenantName),
	}
}

// MockSender for testing
type MockSender struct {
	SentEmails []*Email
}

// NewMockSender creates a new mock sender
func NewMockSender() *MockSender {
	return &MockSender{
		SentEmails: make([]*Email, 0),
	}
}

// Send mocks sending email
func (m *MockSender) Send(email *Email) error {
	m.SentEmails = append(m.SentEmails, email)
	return nil
}

// GetLastEmail gets last sent email
func (m *MockSender) GetLastEmail() *Email {
	if len(m.SentEmails) == 0 {
		return nil
	}
	return m.SentEmails[len(m.SentEmails)-1]
}

// Clear clears sent emails
func (m *MockSender) Clear() {
	m.SentEmails = make([]*Email, 0)
}
