package config

import (
	"log"
	"encoding/json"
    "io/ioutil"
    "encoding/base64"
)

type Credentials struct {
	Login string `json:"login"`
	Password string `json:"password"`
	Encoded string `json:"encoded"`
}

func (credentials Credentials) GetBasicAuth() string {
	if (credentials.Encoded != "") {
		return credentials.Encoded
	}

	return base64.StdEncoding.EncodeToString([]byte(credentials.Login + ":" + credentials.Password))
}

func GetCredentials() (Credentials, error) {
	credentialsBytes, err := ioutil.ReadFile(InExecutionDirectory("credentials.json"))
    if err != nil {
        return Credentials {}, err
    }
    var credentials = Credentials {}
	if err = json.Unmarshal(credentialsBytes, &credentials); err != nil {
		return Credentials {}, err
	}

	return credentials, nil
}

func UpdateCredentialsFile() {
	log.Println("Credentials Encoding: Start")

	log.Println("Credentials Encoding: Loading from file")
	credentials, err := GetCredentials()
	if err != nil {
		log.Println(err.Error())
		return
	}
	log.Println("Credentials Encoding: Loaded", credentials)

	log.Println("Credentials Encoding: Encoding")
	credentials.Encoded = credentials.GetBasicAuth()
	credentials.Login = ""
	credentials.Password = ""

	log.Println("Credentials Encoding: Serialization to JSON")
	credentialsJson, err := json.Marshal(credentials); 
	if err != nil {
		log.Println(err.Error())
		return
	}

	log.Println("Credentials Encoding: Saving to File")
	filePath := InExecutionDirectory("credentials.json")
	if err := ioutil.WriteFile(filePath, credentialsJson, 0644); err != nil {
		log.Println(err.Error())
		return
	}
	log.Println("Credentials Encoding: Saved", filePath)
}
