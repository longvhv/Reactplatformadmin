package jsonutil

import (
	"encoding/json"
	"io"
)

// Marshal marshals value to JSON bytes
func Marshal(v interface{}) ([]byte, error) {
	return json.Marshal(v)
}

// MarshalIndent marshals value to indented JSON bytes
func MarshalIndent(v interface{}) ([]byte, error) {
	return json.MarshalIndent(v, "", "  ")
}

// Unmarshal unmarshals JSON bytes to value
func Unmarshal(data []byte, v interface{}) error {
	return json.Unmarshal(data, v)
}

// Decode decodes JSON from reader
func Decode(r io.Reader, v interface{}) error {
	return json.NewDecoder(r).Decode(v)
}

// Encode encodes value to JSON writer
func Encode(w io.Writer, v interface{}) error {
	return json.NewEncoder(w).Encode(v)
}

// ToString converts value to JSON string
func ToString(v interface{}) string {
	bytes, err := Marshal(v)
	if err != nil {
		return ""
	}
	return string(bytes)
}

// ToPrettyString converts value to pretty JSON string
func ToPrettyString(v interface{}) string {
	bytes, err := MarshalIndent(v)
	if err != nil {
		return ""
	}
	return string(bytes)
}

// FromString parses JSON string to value
func FromString(s string, v interface{}) error {
	return Unmarshal([]byte(s), v)
}

// Clone deep clones value using JSON marshal/unmarshal
func Clone(src, dst interface{}) error {
	bytes, err := Marshal(src)
	if err != nil {
		return err
	}
	return Unmarshal(bytes, dst)
}

// IsValid checks if string is valid JSON
func IsValid(s string) bool {
	var js interface{}
	return Unmarshal([]byte(s), &js) == nil
}

// Merge merges multiple JSON objects
func Merge(objects ...map[string]interface{}) map[string]interface{} {
	result := make(map[string]interface{})
	for _, obj := range objects {
		for k, v := range obj {
			result[k] = v
		}
	}
	return result
}

// GetString gets string value from JSON object
func GetString(obj map[string]interface{}, key string) string {
	if v, ok := obj[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

// GetInt gets int value from JSON object
func GetInt(obj map[string]interface{}, key string) int {
	if v, ok := obj[key]; ok {
		switch val := v.(type) {
		case int:
			return val
		case float64:
			return int(val)
		}
	}
	return 0
}

// GetBool gets bool value from JSON object
func GetBool(obj map[string]interface{}, key string) bool {
	if v, ok := obj[key]; ok {
		if b, ok := v.(bool); ok {
			return b
		}
	}
	return false
}

// GetArray gets array value from JSON object
func GetArray(obj map[string]interface{}, key string) []interface{} {
	if v, ok := obj[key]; ok {
		if arr, ok := v.([]interface{}); ok {
			return arr
		}
	}
	return nil
}

// GetObject gets object value from JSON object
func GetObject(obj map[string]interface{}, key string) map[string]interface{} {
	if v, ok := obj[key]; ok {
		if o, ok := v.(map[string]interface{}); ok {
			return o
		}
	}
	return nil
}
