package jira

import (
	"net/http"
	"encoding/json"
    "net/url"
    "io/ioutil"
    "strconv"
	"log"
    "time"
    "reflect"

	"github.com/JaverSingleton/scrum-charts/config"
)

var cache = make(map[string]JiraSearch)

func InvalidateCache() {
	cache = make(map[string]JiraSearch)
}

func GetIssues(config config.Config, credentials config.Credentials) ([]Issue, error) {
	var jql string
	if (config.Query != "") {
		jql = config.Query
	} else {
		var teamQuery string
		if (config.Team != "") {
			teamQuery = "AND (\"Feature Team\" is EMPTY OR \"Feature Team\" = " + config.Team + ")"
		}
		jql = "Sprint = " + strconv.Itoa(config.Code) + " " +
                "AND (resolutiondate is EMPTY OR resolutiondate >= \"" + config.StartDate + "\")" +
                teamQuery
	}
    log.Println("Search:", jql)
	return Search(config, credentials, jql)
}

func Search(config config.Config, credentials config.Credentials, jql string) ([]Issue, error) { 
	search, err := search(config, credentials, jql)
    if err != nil {
    	return []Issue {}, err
    }
	stories := collectStories(search.Issues)
	issues:= make([]*Issue, len(search.Issues))
	issuesMap := make(map[string]*Issue)
	for index, element := range search.Issues {
		key, issue := convertJiraIssue(stories, element)
		issues[index] = &issue
		issuesMap[key] = &issue
	}
    log.Println("Start Children processing")
	for index, issue := range issues {
		for _, childIssueKey := range issue.Subtasks {
    		log.Println("Children key:", issue.Title, childIssueKey)
			if childIssue, ok := issuesMap[childIssueKey]; ok {  
				childIssue.Parents = issues[index].Parents
				issues[index].IsProgress = issues[index].IsProgress || childIssue.IsProgress
			}
		}
    	log.Println("Children stories:", issue.Title, issue.ChildrenStories)
	}
    log.Println("Finish Children processing")
    log.Println(issues)

	result:= make([]Issue, len(issues))
	for index, issue := range issues {
		result[index] = *issue
	}
	return result, nil
}

func search(config config.Config, credentials config.Credentials, jql string) (JiraSearch, error) {
	if search, ok := cache[jql]; ok && time.Now().Before(search.ExpiredDate){    
		return search, nil
	}

	var Url *url.URL
    Url, err := url.Parse("https://jr.avito.ru")
    if err != nil {
    	return JiraSearch {}, err
    }

    Url.Path += "/rest/api/2/search"
    parameters := url.Values{}
    parameters.Add("jql", jql)
    parameters.Add("maxResults", "500")
    Url.RawQuery = parameters.Encode()

    log.Println("Create Request:", Url.String())
	req, err := http.NewRequest("GET", Url.String(), nil)
	if (err != nil) {
    	return JiraSearch {}, err
	}
    req.SetBasicAuth(credentials.Login, credentials.Password)
	client := &http.Client {}
    log.Println("Do Request:", Url.String())
	response, err := client.Do(req)
    if err != nil {
    	return JiraSearch {}, err
    }
    defer response.Body.Close()
    log.Println("Read Body")
    contents, err := ioutil.ReadAll(response.Body)
    if err != nil {
    	return JiraSearch {}, err
    }
    var search = JiraSearch {
    	ExpiredDate: time.Now().Local().Add(time.Second * time.Duration(config.CacheLifetime)),
    }
    log.Println("Umarshal JSON")
	if err = json.Unmarshal(contents, &search); err != nil {
		return JiraSearch {}, err
	}
	cache[jql] = search
	return search, nil
}

func collectStories(issues []JiraIssue) map[string]string {
	var storyTypes []string = []string{
		"Story", 
		"Epic",
	}
	stories := make(map[string]string)
	for _, issue := range issues {
		if (contains(issue.Fields.Issuetype.Name, storyTypes)) {
			stories[issue.Key] = issue.Fields.Summary
		}
	}
	return stories
}

func convertJiraIssue(stories map[string]string, jiraIssue JiraIssue) (string, Issue) {
    log.Println("Issue processing:", jiraIssue)
	resolutionDate := convertDate(jiraIssue.Fields.Resolutiondate)
	var blocks []string
    log.Println("Start Blocks processing")
	for _, element := range jiraIssue.Fields.Issuelinks {
		if (element.Type.Name == "Blocks") {
			if storyTitle, ok := stories[element.OutwardIssue.Key]; ok {    
				blocks = append(blocks, storyTitle)
			}
		}
	}
	if storyTitle, ok := stories[jiraIssue.Fields.Epic]; ok {    
		blocks = append(blocks, storyTitle)
	}
	platforms:= make([]string, len(jiraIssue.Fields.Components))
	for index, component := range jiraIssue.Fields.Components {
		platforms[index] = component.Name
	}
    log.Println("Finish Blocks processing")
	subtasks:= make([]string, len(jiraIssue.Fields.Subtasks))
	for index, subtask := range jiraIssue.Fields.Subtasks {
		subtasks[index] = subtask.Key
	}
	var progressValues []string = []string{
		"In Progress", 
		"In test", 
		"In Review", 
		"QA Progress",
		"Ready for merge",
	}
	var doneValues []string = []string{
		"Waiting for release", 
		"In Master", 
		"Resolved", 
		"Released", 
		"Done", 
		"Ready for release", 
		"Closed", 
	}
	isProgress := contains(jiraIssue.Fields.Status.Name, progressValues)
	isDone := contains(jiraIssue.Fields.Status.Name, doneValues)
	if (!isDone) {
		resolutionDate = ""
	}
	var storyTypes []string = []string{
		"Story", 
		"Epic",
	}

	return jiraIssue.Key, Issue {
		Key: jiraIssue.Key,
		StoryPoints: jiraIssue.Fields.Customfield_10212,
		CloseDate: resolutionDate,
		Title: jiraIssue.Fields.Summary,
		Parents: blocks,
		Platforms: platforms,
		Subtasks: subtasks,
		Labels: jiraIssue.Fields.Labels,
		IsProgress: isProgress,
		IsDone: isDone,
		IsStory: contains(jiraIssue.Fields.Issuetype.Name, storyTypes),
		IsChild: len(jiraIssue.Fields.Parent.Id) > 0,
	}
}

func contains(v interface{}, in interface{}) (ok bool) {
	var i int
    val := reflect.Indirect(reflect.ValueOf(in))
    switch val.Kind() {
    case reflect.Slice, reflect.Array:
        for ; i < val.Len(); i++ {
            if ok = v == val.Index(i).Interface(); ok {
                return
            }
        }
    }
    return
}

func convertDate(date string) string {
	time, err := time.Parse("2006-01-02T15:04:05-0700", date)
    log.Println(date, time)
	if err != nil {
	    return ""
	}
	return time.Format("2006-01-02")
}

type Issue struct {
    Key string `json:"key"`
	StoryPoints float64 `json:"storyPoints"`
	CloseDate string `json:"closeDate"`
    Title string `json:"title"`
    Parents []string `json:"parents"`
    Platforms []string `json:"platforms"`
    ChildrenStories float64 `json:"childrenStories"`
    Subtasks []string `json:"subtasks"`
    IsProgress bool `json:"isProgress"`
    IsDone bool `json:"isDone"`
    IsStory bool `json:"isStory"`
    IsChild bool `json:"isChild"`
    Labels []string `json:"labels"`
}

type JiraIssue struct {
    Id string `json:"id"`
    Key string `json:"key"`
    Fields JiraFields `json:"fields"`
}

type JiraFields struct {
    Customfield_10212 float64 `json:"customfield_10212"`
    Resolutiondate string `json:"resolutiondate"`
    Summary string `json:"summary"`
    Issuetype JiraType `json:"issuetype"`
    Status JiraStatus `json:"status"`
    Issuelinks []JiraLink `json:"issuelinks"`
    Epic string `json:"customfield_10216"`
    Labels []string `json:"labels"`
    Components []JiraComponent `json:"components"`
    Subtasks []JiraIssue `json:"subtasks"`
    Parent JiraParent `json:"parent"`
}

type JiraSearch struct {
    Expand string `json:"expand"`
    Issues []JiraIssue `json:"issues"`
    MaxResults int `json:"maxResults"`
    StartAt int `json:"startAt"`
    Total int `json:"total"`
    ExpiredDate time.Time `json:"expiredDate"`
}

type JiraType struct {
    Id string `json:"id"`
    Name string `json:"name"`
}

type JiraLink struct {
    Id string `json:"id"`
    Type JiraType `json:"type"`
    OutwardIssue JiraOutward `json:"outwardIssue"`
}

type JiraOutward struct {
    Id string `json:"id"`
    Key string `json:"key"`
}

type JiraComponent struct {
    Id string `json:"id"`
    Name string `json:"name"`
}

type JiraStatus struct {
    Id string `json:"id"`
    Name string `json:"name"`
}

type JiraParent struct {
    Id string `json:"id"`
    Key string `json:"key"`
}
