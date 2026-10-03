package utils

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

func ParseExtendedDuration(s string) (time.Duration, error) {
	if s == "" {
		return 0, fmt.Errorf("empty duration")
	}

	var result time.Duration
	var currentNum strings.Builder
	var currentUnit strings.Builder

	for i, r := range s {
		if (r >= '0' && r <= '9') || r == '.' {
			currentNum.WriteRune(r)
		} else if r >= 'a' && r <= 'z' {
			currentUnit.WriteRune(r)
		} else {
			return 0, fmt.Errorf("invalid character at position %d", i)
		}

		if currentUnit.Len() > 0 && (i+1 >= len(s) || s[i+1] < 'a' || s[i+1] > 'z') {
			num, err := strconv.ParseFloat(currentNum.String(), 64)
			if err != nil {
				return 0, fmt.Errorf("invalid number: %s", currentNum.String())
			}

			unit := currentUnit.String()
			switch unit {
			case "w":
				result += time.Duration(num * 7 * 24 * float64(time.Hour))
			case "d":
				result += time.Duration(num * 24 * float64(time.Hour))
			case "h":
				result += time.Duration(num * float64(time.Hour))
			case "m":
				result += time.Duration(num * float64(time.Minute))
			case "s":
				result += time.Duration(num * float64(time.Second))
			default:
				return 0, fmt.Errorf("unknown unit: %s", unit)
			}

			currentNum.Reset()
			currentUnit.Reset()
		}
	}

	return result, nil
}
