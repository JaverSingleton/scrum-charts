package planning

import (
    "strconv"
	"log"
	"time"
	"strings"

	"github.com/JaverSingleton/scrum-charts/jira"
	"github.com/JaverSingleton/scrum-charts/config"
)

func GetPlanningInfo(config config.Config, credentials config.Credentials, teams map[string]config.FeatureTeam) (PlanningInfo, error) {

	var jql string = "Sprint = " + strconv.Itoa(config.Code) + " AND " + 
		"type != Epic AND type != Story"

    var plannedIssues []Issue 
    log.Println("Planned Issues getting: Start")
	if plannedIssuesSearch, err := jira.FindByJql(config, credentials, jql); err == nil {
    	log.Println("Planned Issues getting: Completed")
    	plannedIssues = convert(plannedIssuesSearch)
	}

	jql = "Sprint = " + strconv.Itoa(config.PrevCode) + " AND " + 
		"Sprint != " + strconv.Itoa(config.Code) + " AND " + 
		"type != Epic AND type != Story" + " AND " +
		"resolutiondate is EMPTY"

    var lostIssues []Issue 
    log.Println("Lost Issues getting: Start")
	if lostIssuesSearch, err := jira.FindByJql(config, credentials, jql); err == nil {
    	log.Println("Lost Issues getting: Completed")
		lostIssues = convert(lostIssuesSearch)
	}

	team := teams[config.Team]
	users := make(map[string]User)

	for _, teamUser := range team.Users {
		users[teamUser] = createUser(teamUser, plannedIssues, lostIssues)
	}
    
    return PlanningInfo { 
    	Users: users,
    	MaxStoryPoints: team.SpPerDay * float64(calculateDatesDelta(config.StartDate, config.FinishDate) - len(config.Weekend) - 2),
    }, nil
}

func createUser(assignee string, plannedIssues []Issue, lostIssues []Issue) User {
	var userPlannedIssues []Issue = make([]Issue, 0)
	for _, issue := range plannedIssues {
		if (issue.Assignee == assignee) {
			userPlannedIssues = append(userPlannedIssues, issue)
		}
	}
	var userLostIssues []Issue = make([]Issue, 0)
	for _, issue := range lostIssues {
		if (issue.Assignee == assignee) {
			userLostIssues = append(userLostIssues, issue)
		}
	}
	return User {
		Name: assignee,
		PlannedIssues: userPlannedIssues,
		LostIssues: userLostIssues,
	}
}

func convert(jiraSearch jira.Search) []Issue {
    log.Println("Issues processing: Start")
	var result []Issue = make([]Issue, 0)
	issues := make(map[string]Issue)
	for _, jiraIssue := range jiraSearch.Issues {
		issues[jiraIssue.Key] = convertIssue(jiraIssue)
	}
	for _, jiraIssue := range jiraSearch.Issues {
    	log.Println("Issue " + jiraIssue.Key + " processing")
		if issue, ok := issues[jiraIssue.Key]; ok {
			if (issue.Type == "QA") {
				issue.Development = findDevelopmentIssue(issues, jiraIssue)
			} else {
				issue.QA = findTestIssue(issues, jiraIssue)
				issue.TestCases = findTestCassesIssue(issues, jiraIssue)
			}
			result = append(result, issue)
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
		if hasTestsCassesSubstring(qaIssue.Name)   {    
			return &qaIssue
		} 
	}

	return nil
}

func findDevelopmentIssue(issues map[string]Issue, targetIssue jira.Issue) *Issue {
	developmentIssues := findDevelopmentIssues(issues, targetIssue)
	if (len(developmentIssues) > 0) {
		return &developmentIssues[0]
	} else {
		return nil
	}
}

func findQaIssue(issues map[string]Issue, targetIssue jira.Issue) (result []Issue) {
	for _, link := range targetIssue.Fields.Issuelinks {
		if (link.Type.Name == "Blocks" && link.OutwardIssue.Key != "" && link.OutwardIssue.Fields.Issuetype.Name == "QA") {
			if qaIssue, ok := issues[link.OutwardIssue.Key]; ok {  
				if (qaIssue.Platform == "QA") {
					result = append(result, qaIssue)
				}
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

func findDevelopmentIssues(issues map[string]Issue, targetIssue jira.Issue) (result []Issue) {
	for _, link := range targetIssue.Fields.Issuelinks {
		if (link.Type.Name == "Blocks" && link.InwardIssue.Key != "" && link.InwardIssue.Fields.Issuetype.Name != "QA" && link.InwardIssue.Fields.Issuetype.Name != "Story") {
			foundIssue, hasIssue := issues[link.InwardIssue.Key]
			var assignee = ""
			if (hasIssue) {
				assignee = foundIssue.Assignee
			}
			developmentIssue := Issue {
				Assignee: assignee,
				Key: link.InwardIssue.Key,
				Name: link.InwardIssue.Fields.Summary,
				OutSprint: !hasIssue,
				Type: link.InwardIssue.Fields.Issuetype.Name,
				Uri: createUri(link.InwardIssue.Key),
				IsResolved: link.InwardIssue.Fields.Status.Category.Key == "done",
			}
			result = append(result, developmentIssue)
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
	Users map[string]User `json:"users"`
}

type User struct {
    Name string `json:"name"`
	PlannedIssues []Issue `json:"plannedIssues"`
	LostIssues []Issue `json:"lostIssues"`
}

type Issue struct {
    Key string `json:"key"`
    Name string `json:"name"`
    Development *Issue `json:"development"`
    QA *Issue `json:"qa"`
    TestCases *Issue `json:"testCasses"`
    StoryPoints *float64 `json:"storyPoints"`
    Type string `json:"type"`
    Assignee string `json:"assignee"`
    Platform string `json:"platform"`
    OutSprint bool `json:"outSprint"`
    IsResolved bool `json:"isResolved"`
    Uri string `json:"uri"`
}