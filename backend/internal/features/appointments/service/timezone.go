package service

import (
	"time"
	_ "time/tzdata"
)

var businessLocation = func() *time.Location {
	location, err := time.LoadLocation("America/Mexico_City")
	if err != nil {
		return time.FixedZone("America/Mexico_City", -6*60*60)
	}
	return location
}()
