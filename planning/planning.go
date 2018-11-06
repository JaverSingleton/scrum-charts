package planning

import (
    "strconv"
	"log"
	"time"
	"strings"

	"github.com/JaverSingleton/scrum-charts/jira"
	"github.com/JaverSingleton/scrum-charts/config"
)

func GetPlanningInfo(config config.Config, credentials config.Credentials, assignee string) (PlanningInfo, error) {
	var teamQuery string
	if (config.Team != "") {
		teamQuery = " AND (\"Feature Team\" is EMPTY OR \"Feature Team\" = " + config.Team + ")"
	}

	var jql string = "Sprint = " + strconv.Itoa(config.Code) + " AND " + 
		"type != Epic AND type != Story" + 
		teamQuery
    var plannedIssues []Issue 
    log.Println("Planned Issues getting: Start")
	if plannedIssuesSearch, err := jira.FindByJql(config, credentials, jql); err == nil {
    	log.Println("Planned Issues getting: Completed")
    	plannedIssues = convert(plannedIssuesSearch, assignee)
	}

	jql = "Sprint = " + strconv.Itoa(config.PrevCode) + " AND " + 
		"Sprint != " + strconv.Itoa(config.Code) + " AND " + 
		"type != Epic AND type != Story" + " AND " +
		"resolutiondate is EMPTY" + 
		teamQuery
    var lostIssues []Issue 
    log.Println("Lost Issues getting: Start")
	if lostIssuesSearch, err := jira.FindByJql(config, credentials, jql); err == nil {
    	log.Println("Lost Issues getting: Completed")
		lostIssues = convert(lostIssuesSearch, assignee)
	}
    
    return PlanningInfo { 
    	PlannedIssues: plannedIssues,
    	LostIssues: lostIssues,
    	MaxStoryPoints: config.SpPerDay * float64(calculateDatesDelta(config.StartDate, config.FinishDate) - len(config.Weekend) - 2),
    }, nil
}

func convert(jiraSearch jira.Search, assignee string) []Issue {
    log.Println("Issues processing: Start")
	var result []Issue = make([]Issue, 0)
	issues := make(map[string]Issue)
	for _, jiraIssue := range jiraSearch.Issues {
		issues[jiraIssue.Key] = convertIssue(jiraIssue)
	}
	for _, jiraIssue := range jiraSearch.Issues {
    	log.Println("Issue " + jiraIssue.Key + " processing")
		if issue, ok := issues[jiraIssue.Key]; ok {
			issue.QA = findTestIssue(issues, jiraIssue)
			issue.TestCases = findTestCassesIssue(issues, jiraIssue)
			if (jiraIssue.Fields.Assignee.Name == assignee) {
				result = append(result, issue)
			}
		}
	}
    log.Println("Issues processing: Completed")
	return result
}

func convertIssue(jiraIssue jira.Issue) Issue {
    log.Println("Issue " + jiraIssue.Key + " converting")
	return Issue { 
		Key: jiraIssue.Key,
		Name: jiraIssue.Fields.Summary,
		StoryPoints: jiraIssue.Fields.Customfield_10212,
		Type: jiraIssue.Fields.Issuetype.Name,
		Assignee: jiraIssue.Fields.Assignee.Name,
		Platform: jiraIssue.Fields.Components[0].Name,
		Uri: createUri(jiraIssue.Key),
		IsResolved: jiraIssue.Fields.Status.Category.Key == "done",
	}
}

func findTestIssue(issues map[string]Issue, targetIssue jira.Issue) *Issue {
	qaIssues := findQaIssue(issues, targetIssue)
	for _, qaIssue := range qaIssues {
		if !hasTestsCassesSubstring(qaIssue.Name) {    
			return &qaIssue
		} 
	}

	return nil
}

func findTestCassesIssue(issues map[string]Issue, targetIssue jira.Issue) *Issue {
	qaIssues := findQaIssue(issues, targetIssue)
	for _, qaIssue := range qaIssues {
		if hasTestsCassesSubstring(qaIssue.Name) {    
			return &qaIssue
		} 
	}

	return nil
}

func findQaIssue(issues map[string]Issue, targetIssue jira.Issue) (result []Issue) {
	for _, link := range targetIssue.Fields.Issuelinks {
		if (link.Type.Name == "Blocks" && link.OutwardIssue.Fields.Issuetype.Name == "QA") {
			if qaIssue, ok := issues[link.OutwardIssue.Key]; ok {  
				result = append(result, qaIssue)
			} else {
				qaIssue := Issue {
					Key: link.OutwardIssue.Key,
					Name: link.OutwardIssue.Fields.Summary,
					OutSprint: true,
					Type: link.OutwardIssue.Fields.Issuetype.Name,
					Uri: createUri(link.OutwardIssue.Key),
					IsResolved: link.OutwardIssue.Fields.Status.Category.Key == "done",
				}
				result = append(result, qaIssue)
			}
		}
	}
	return
}

func createUri(key string) string {
	return "https://jr.avito.ru/browse/" + key
}

func hasTestsCassesSubstring(title string) (result bool) {
	lowerTitle := strings.ToLower(title)
	result = false
	result = result || strings.Contains(lowerTitle, "тесткейс")
	result = result || strings.Contains(lowerTitle, "тест-кейс")
	result = result || strings.Contains(lowerTitle, "test casse")
	result = result || strings.Contains(lowerTitle, "test-casse")
	result = result || strings.Contains(lowerTitle, "test case")
	result = result || strings.Contains(lowerTitle, "test-case")
	return
}

func calculateDatesDelta(startDate string, finishDate string) int {
	startTime, err := time.Parse("2006-01-02", startDate)
	if err != nil {
	    return 0
	}
	finishTime, err := time.Parse("2006-01-02", finishDate)
	if err != nil {
	    return 0
	}
	return int(finishTime.Sub(startTime).Hours() / 24) + 1
}

type PlanningInfo struct {
	MaxStoryPoints float64 `json:"maxStoryPoints"`
	PlannedIssues []Issue `json:"plannedIssues"`
	LostIssues []Issue `json:"lostIssues"`
}

type Issue struct {
    Key string `json:"key"`
    Name string `json:"name"`
    QA *Issue `json:"qa"`
    TestCases *Issue `json:"testCasses"`
    StoryPoints float64 `json:"storyPoints"`
    Type string `json:"type"`
    Assignee string `json:"assignee"`
    Platform string `json:"platform"`
    OutSprint bool `json:"outSprint"`
    IsResolved bool `json:"isResolved"`
    Uri string `json:"uri"`
}