package config

import (
	"encoding/json"
    "io/ioutil"
)

type FeatureTeam struct {
	Users []string `json:"users"`
	SpPerDay float64 `json:"spPerDay"`
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
