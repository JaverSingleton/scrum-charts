package config

import (
	"encoding/json"
    "io/ioutil"
)

type Config struct {
	Query string `json:"query"`
	Name string `json:"name"`
	StartDate string `json:"startDate"`
	FinishDate string `json:"finishDate"`
	Weekend []string `json:"weekend"`
	Code int `json:"code"`
	PrevCode int `json:"prevCode"`
	SpPerDay float64 `json:"spPerDay"`
	Team string `json:"team"`
	CacheLifetime int `json:"cacheLifetime"`
}

func GetConfig() (Config, error) {
	configBytes, err := ioutil.ReadFile("config.json")
    if err != nil {
        return Config {}, err
    }
    var config = Config {}
	if err = json.Unmarshal(configBytes, &config); err != nil {
		return Config {}, err
	}

	return config, nil
}