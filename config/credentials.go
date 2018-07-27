package config

import (
	"encoding/json"
    "io/ioutil"
)

type Credentials struct {
	Login string `json:"login"`
	Password string `json:"password"`
}

func GetCredentials() (Credentials, error) {
	credentialsBytes, err := ioutil.ReadFile("credentials.json")
    if err != nil {
        return Credentials {}, err
    }
    var credentials = Credentials {}
	if err = json.Unmarshal(credentialsBytes, &credentials); err != nil {
		return Credentials {}, err
	}

	return credentials, nil
}
