package charts

import (
    "strconv"
	"log"
    "time"
    "reflect"

	"github.com/JaverSingleton/scrum-charts/jira"
	"github.com/JaverSingleton/scrum-charts/config"
)

func GetIssues(manager *jira.JobManager, config config.Config, credentials config.Credentials) ([]Issue, error) {
	var jql string
	if (config.Query != "") {
		jql = config.Query
	} else {
		var teamQuery string
		if (config.Team != "") {
			teamQuery = "AND \"Feature teams\"  = " + config.Team
		}
		jql = "Sprint = " + strconv.Itoa(config.Code) + " " +
                teamQuery
	}
    log.Println("Search:", jql)
	return search(manager, config, credentials, jql)
}

func search(manager *jira.JobManager, config config.Config, credentials config.Credentials, jql string) ([]Issue, error) { 
	searchCh := make(chan jira.Search)
	go manager.AddJob(jql, searchCh)
	search := <-searchCh

	stories := collectStories(search.Issues)
	issues:= make([]*Issue, len(search.Issues))
	issuesMap := make(map[string]*Issue)
	for index, element := range search.Issues {
		key, issue := convertJiraIssue(stories, element)
		issues[index] = &issue
		issuesMap[key] = &issue
	}
	for index, issue := range issues {
		for _, childIssueKey := range issue.Subtasks {
			if childIssue, ok := issuesMap[childIssueKey]; ok {  
				childIssue.Parents = issues[index].Parents
				issues[index].IsProgress = issues[index].IsProgress || childIssue.IsProgress
				if (childIssue.StoryPoints > 0) {
					issues[index].StoryPoints = 0
				}
			}
		}
	}

	result:= make([]Issue, len(issues))
	sprintStartDate := date(config.StartDate)
	for index, issue := range issues {
    	closeDate := date(issue.CloseDate)
    	if (issue.CloseDate == "" || sprintStartDate.Before(closeDate) || sprintStartDate.Equal(closeDate)) {
			result[index] = *issue
		}
	}
	return result, nil
}

func collectStories(issues []jira.Issue) map[string]string {
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

func convertJiraIssue(stories map[string]string, jiraIssue jira.Issue) (string, Issue) {
	resolutionDate := convertDate(jiraIssue.Fields.Resolutiondate)
	var blocks []string
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

	var storyPoints = float64(0)
	if (jiraIssue.Fields.Customfield_10212 != nil) {
		storyPoints = *jiraIssue.Fields.Customfield_10212
	}

	return jiraIssue.Key, Issue {
		Key: jiraIssue.Key,
		StoryPoints: storyPoints,
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
	if err != nil {
	    return ""
	}
	return time.Format("2006-01-02")
}

func date(date string) time.Time {
	result, err := time.Parse("2006-01-02", date)
	if err != nil {
	    return time.Now()
	} 
	return result
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
