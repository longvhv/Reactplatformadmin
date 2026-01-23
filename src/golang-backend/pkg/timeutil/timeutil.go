package timeutil

import (
	"time"
)

// Common time formats
const (
	DateFormat     = "2006-01-02"
	DateTimeFormat = "2006-01-02 15:04:05"
	TimeFormat     = "15:04:05"
)

// Now returns current time
func Now() time.Time {
	return time.Now()
}

// UTC returns current UTC time
func UTC() time.Time {
	return time.Now().UTC()
}

// StartOfDay returns start of day (00:00:00)
func StartOfDay(t time.Time) time.Time {
	year, month, day := t.Date()
	return time.Date(year, month, day, 0, 0, 0, 0, t.Location())
}

// EndOfDay returns end of day (23:59:59)
func EndOfDay(t time.Time) time.Time {
	year, month, day := t.Date()
	return time.Date(year, month, day, 23, 59, 59, 999999999, t.Location())
}

// StartOfWeek returns start of week (Monday 00:00:00)
func StartOfWeek(t time.Time) time.Time {
	weekday := int(t.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	return StartOfDay(t.AddDate(0, 0, -weekday+1))
}

// EndOfWeek returns end of week (Sunday 23:59:59)
func EndOfWeek(t time.Time) time.Time {
	return EndOfDay(StartOfWeek(t).AddDate(0, 0, 6))
}

// StartOfMonth returns start of month (1st 00:00:00)
func StartOfMonth(t time.Time) time.Time {
	year, month, _ := t.Date()
	return time.Date(year, month, 1, 0, 0, 0, 0, t.Location())
}

// EndOfMonth returns end of month (last day 23:59:59)
func EndOfMonth(t time.Time) time.Time {
	return EndOfDay(StartOfMonth(t).AddDate(0, 1, -1))
}

// StartOfYear returns start of year (Jan 1 00:00:00)
func StartOfYear(t time.Time) time.Time {
	year, _, _ := t.Date()
	return time.Date(year, 1, 1, 0, 0, 0, 0, t.Location())
}

// EndOfYear returns end of year (Dec 31 23:59:59)
func EndOfYear(t time.Time) time.Time {
	year, _, _ := t.Date()
	return time.Date(year, 12, 31, 23, 59, 59, 999999999, t.Location())
}

// IsToday checks if time is today
func IsToday(t time.Time) bool {
	now := Now()
	return t.Year() == now.Year() && t.Month() == now.Month() && t.Day() == now.Day()
}

// IsYesterday checks if time is yesterday
func IsYesterday(t time.Time) bool {
	yesterday := Now().AddDate(0, 0, -1)
	return t.Year() == yesterday.Year() && t.Month() == yesterday.Month() && t.Day() == yesterday.Day()
}

// IsTomorrow checks if time is tomorrow
func IsTomorrow(t time.Time) bool {
	tomorrow := Now().AddDate(0, 0, 1)
	return t.Year() == tomorrow.Year() && t.Month() == tomorrow.Month() && t.Day() == tomorrow.Day()
}

// IsPast checks if time is in the past
func IsPast(t time.Time) bool {
	return t.Before(Now())
}

// IsFuture checks if time is in the future
func IsFuture(t time.Time) bool {
	return t.After(Now())
}

// DaysSince returns days since time
func DaysSince(t time.Time) int {
	return int(Now().Sub(t).Hours() / 24)
}

// DaysUntil returns days until time
func DaysUntil(t time.Time) int {
	return int(t.Sub(Now()).Hours() / 24)
}

// HumanReadable returns human readable time difference
func HumanReadable(t time.Time) string {
	now := Now()
	diff := now.Sub(t)
	
	if diff < time.Minute {
		return "just now"
	}
	if diff < time.Hour {
		minutes := int(diff.Minutes())
		if minutes == 1 {
			return "1 minute ago"
		}
		return string(rune(minutes)) + " minutes ago"
	}
	if diff < 24*time.Hour {
		hours := int(diff.Hours())
		if hours == 1 {
			return "1 hour ago"
		}
		return string(rune(hours)) + " hours ago"
	}
	if diff < 7*24*time.Hour {
		days := int(diff.Hours() / 24)
		if days == 1 {
			return "1 day ago"
		}
		return string(rune(days)) + " days ago"
	}
	if diff < 30*24*time.Hour {
		weeks := int(diff.Hours() / 24 / 7)
		if weeks == 1 {
			return "1 week ago"
		}
		return string(rune(weeks)) + " weeks ago"
	}
	if diff < 365*24*time.Hour {
		months := int(diff.Hours() / 24 / 30)
		if months == 1 {
			return "1 month ago"
		}
		return string(rune(months)) + " months ago"
	}
	
	years := int(diff.Hours() / 24 / 365)
	if years == 1 {
		return "1 year ago"
	}
	return string(rune(years)) + " years ago"
}

// FormatDate formats time as date
func FormatDate(t time.Time) string {
	return t.Format(DateFormat)
}

// FormatDateTime formats time as datetime
func FormatDateTime(t time.Time) string {
	return t.Format(DateTimeFormat)
}

// FormatTime formats time as time
func FormatTime(t time.Time) string {
	return t.Format(TimeFormat)
}

// ParseDate parses date string
func ParseDate(s string) (time.Time, error) {
	return time.Parse(DateFormat, s)
}

// ParseDateTime parses datetime string
func ParseDateTime(s string) (time.Time, error) {
	return time.Parse(DateTimeFormat, s)
}

// AddBusinessDays adds business days (excluding weekends)
func AddBusinessDays(t time.Time, days int) time.Time {
	result := t
	daysAdded := 0
	
	for daysAdded < days {
		result = result.AddDate(0, 0, 1)
		if result.Weekday() != time.Saturday && result.Weekday() != time.Sunday {
			daysAdded++
		}
	}
	
	return result
}

// IsBusinessDay checks if time is a business day (not weekend)
func IsBusinessDay(t time.Time) bool {
	return t.Weekday() != time.Saturday && t.Weekday() != time.Sunday
}
