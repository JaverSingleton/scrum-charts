package main

import (
	"fmt"
	"log"
	"html/template"
	"net/http"
	"encoding/json"
	"strconv"

	"github.com/JaverSingleton/scrum-charts/jira"
	"github.com/JaverSingleton/scrum-charts/charts"
	"github.com/JaverSingleton/scrum-charts/config"
	"github.com/JaverSingleton/scrum-charts/planning"
)

var jobManager jira.JobManager = jira.NewJobManager()

func platforms(w http.ResponseWriter, r *http.Request) {
	t, err := template.ParseFiles(config.InExecutionDirectory("assets/templates/platforms.html"))
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
	t, err := template.ParseFiles(config.InExecutionDirectory("assets/templates/epic.html"))
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
	t, err := template.ParseFiles(config.InExecutionDirectory("assets/templates/burndown.html"))
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

func planningInfo(w http.ResponseWriter, r *http.Request) {
	t, err := template.ParseFiles(config.InExecutionDirectory("assets/templates/planning.html"))
	if err != nil {
		fmt.Fprintf(w, err.Error())
		return
	}
	teams, err := config.GetTeams()
	if err != nil {
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var teamName = ""
	if array, ok := r.URL.Query()["team"]; ok && len(array) > 0 {    
		teamName = array[0]
	}
	log.Println("Get Planning Info")
	team := teams[teamName]
	info, err := planning.GetPlanningInfo(&jobManager, &team)
	if err != nil {
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	params := struct {
		PlanningInfo planning.PlanningInfo
	} {
		PlanningInfo: info,
	}

	t.ExecuteTemplate(w, "planning", params)
}

func planningInfo2(w http.ResponseWriter, r *http.Request) {
	t, err := template.ParseFiles(config.InExecutionDirectory("assets/templates/planning2.html"))
	if err != nil {
		fmt.Fprintf(w, err.Error())
		return
	}
	teams, err := config.GetTeams()
	if err != nil {
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var teamName = ""
	if array, ok := r.URL.Query()["team"]; ok && len(array) > 0 {    
		teamName = array[0]
	}
	log.Println("Get Planning Info")
	team := teams[teamName]
	info, err := planning.GetPlanningInfo2(&jobManager, &team, teamName)
	if err != nil {
		log.Println(err.Error())
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	params := struct {
		PlanningInfo planning.PlanningInfo2
	} {
		PlanningInfo: info,
	}

	t.ExecuteTemplate(w, "planning2", params)
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
	issues, err := charts.GetIssues(&jobManager, config, credentials)
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
		Issues []charts.Issue `json:"issues"`
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
	updateConfigurations()
	jobManager.ClearJobs()
	w.Write([]byte("Cache is clean"))
}

func refreshCache(w http.ResponseWriter, r *http.Request) {
	updateConfigurations()
	jobManager.RefreshAllWithWait()
	w.Write([]byte("Cache is refreshed"))
}

func main() {
	config.UpdateCredentialsFile()
	updateConfigurations()
	go jobManager.StartAutoRefresh()
	fmt.Println("Listening on port :3000")

	http.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir(config.InExecutionDirectory("assets/")))))
	http.HandleFunc("/burndown", burndown)
	http.HandleFunc("/epic", epic)
	http.HandleFunc("/platforms", platforms)
	http.HandleFunc("/ping", ping)
	http.HandleFunc("/cache/refresh", refreshCache)
	http.HandleFunc("/cache/invalidate", invalidateCache)
	http.HandleFunc("/sprint", sprintInfo)
	http.HandleFunc("/planning", planningInfo)
	http.HandleFunc("/planning2", planningInfo2)

	http.ListenAndServe(":3000", nil)
}

func updateConfigurations() {
	credentials, err := config.GetCredentials()
	if err != nil {
		log.Println(err.Error())
		return
	}
	config, err := config.GetConfig()
	if err != nil {
		log.Println(err.Error())
		return
	}
	jobManager.Config = config
	jobManager.Credentials = credentials
}
