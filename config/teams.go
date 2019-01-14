package config

import (
	"encoding/json"
    "io/ioutil"
)

type FeatureTeam struct {
	Users []User `json:"users"`
	SpPerDay float64 `json:"spPerDay"`
}

type User struct {
	Name string `json:"name"`
	DayOff float64 `json:"dayOff"`
	Platforms map[string]float64 `json:"platforms"`
}

func GetTeams() (map[string]FeatureTeam, error) {
    var teams = make(map[string]FeatureTeam)
	teamsByters, err := ioutil.ReadFile(InExecutionDirectory("teams.json"))
    if err != nil {
        return teams, err
    }
	if err = json.Unmarshal(teamsByters, &teams); err != nil {
		return teams, err
	}

	return teams, nil
}
