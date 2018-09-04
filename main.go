package main

import (
	"fmt"
	"log"
	"html/template"
	"net/http"
	"encoding/json"
	"strconv"

	"github.com/JaverSingleton/scrum-charts/jira"
	"github.com/JaverSingleton/scrum-charts/config"
)

func platforms(w http.ResponseWriter, r *http.Request) {
	t, err := template.ParseFiles("assets/templates/platforms.html")
	if err != nil {
		fmt.Fprintf(w, err.Error())
		return
	}

	var team string
	if array, ok := r.URL.Query()["team"]; ok && len(array) > 0 {    
		team = array[0]
	}
	var code string
	if array, ok := r.URL.Query()["code"]; ok && len(array) > 0 {    
		code = array[0]
	}
	params := struct {
		Team string
		Code string
	} {
		Team: team,
		Code: code,
	}

	t.ExecuteTemplate(w, "platforms", params)
}

func epic(w http.ResponseWriter, r *http.Request) {
	t, err := template.ParseFiles("assets/templates/epic.html")
	if err != nil {
		fmt.Fprintf(w, err.Error())
		return
	}

	var team string
	if array, ok := r.URL.Query()["team"]; ok && len(array) > 0 {    
		team = array[0]
	}
	var code string
	if array, ok := r.URL.Query()["code"]; ok && len(array) > 0 {    
		code = array[0]
	}
	params := struct {
		Team string
		Code string
	} {
		Team: team,
		Code: code,
	}

	t.ExecuteTemplate(w, "epic", params)
}

func burndown(w http.ResponseWriter, r *http.Request) {
	t, err := template.ParseFiles("assets/templates/burndown.html")
	if err != nil {
		fmt.Fprintf(w, err.Error())
		return
	}

	var team string
	if array, ok := r.URL.Query()["team"]; ok && len(array) > 0 {    
		team = array[0]
	}
	var code string
	if array, ok := r.URL.Query()["code"]; ok && len(array) > 0 {    
		code = array[0]
	}
	params := struct {
		Team string
		Code string
	} {
		Team: team,
		Code: code,
	}

	t.ExecuteTemplate(w, "burndown", params)
}

func sprintInfo(w http.ResponseWriter, r *http.Request) {
	log.Println("\r\n")
	log.Println("Get Config")
	credentials, err := config.GetCredentials()
	if err != nil {
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	config, err := config.GetConfig()
	if err != nil {
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if array, ok := r.URL.Query()["team"]; ok && len(array) > 0 {    
		config.Team = array[0]
	}
	if array, ok := r.URL.Query()["code"]; ok && len(array) > 0 {
		if code, err := strconv.Atoi(array[0]); err == nil {    
			config.Code = code
		}
	}
	log.Println("Get Issues")
	issues, err := jira.GetIssues(config, credentials)
	if err != nil {
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	sprint := struct {
		Name string `json:"name"`
		StartDate string `json:"startDate"`
		FinishDate string `json:"finishDate"`
		Weekend []string `json:"weekend"`
		Code int `json:"code"`
		Issues []jira.Issue `json:"issues"`
	} {
		Name: config.Name,
		StartDate: config.StartDate,
		FinishDate: config.FinishDate,
		Weekend: config.Weekend,
		Code: config.Code,
		Issues: issues,
	}
	log.Println("Marshal JSON")
	js, err := json.Marshal(sprint)
	if err != nil {
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
  	w.Header().Set("Content-Type", "application/json")
	w.Write(js)
}

func ping(w http.ResponseWriter, r *http.Request) {
	payload := struct {
		Text string
	} {}
	payload.Text = "pong"

	js, err := json.Marshal(payload)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
  	w.Header().Set("Content-Type", "application/json")
	w.Write(js)
}

func invalidateCache(w http.ResponseWriter, r *http.Request) {
	jira.InvalidateCache()
	w.Write([]byte("Cache is clean"))
}

func main() {
	fmt.Println("Listening on port :3000")

	http.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir("./assets/"))))
	http.HandleFunc("/burndown", burndown)
	http.HandleFunc("/epic", epic)
	http.HandleFunc("/platforms", platforms)
	http.HandleFunc("/ping", ping)
	http.HandleFunc("/cache/invalidate", invalidateCache)
	http.HandleFunc("/sprint", sprintInfo)

	http.ListenAndServe(":3000", nil)
}
