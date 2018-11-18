package config

import (
	"log"
	"encoding/json"
    "io/ioutil"
    "os"
    "path/filepath"
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
	configBytes, err := ioutil.ReadFile(InExecutionDirectory("config.json"))
    if err != nil {
        return Config {}, err
    }
    var config = Config {}
	if err = json.Unmarshal(configBytes, &config); err != nil {
		return Config {}, err
	}

	return config, nil
}

func InExecutionDirectory(file string) string {
	ex, err := os.Executable()
    if err != nil {
    	log.Println(err)
        return file
    }
    exPath := filepath.Dir(ex)
    return exPath + "/" + file
}