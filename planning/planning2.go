package planning

import (
	"github.com/JaverSingleton/scrum-charts/jira"
	"github.com/JaverSingleton/scrum-charts/config"
)

func GetPlanningInfo2(manager *jira.JobManager, team *config.FeatureTeam, teamName string) (PlanningInfo2, error) {
	if (team == nil) {
		return PlanningInfo2 {}, nil
	}

	lostIssues, plannedIssues := findLostAndPlannedIssues(manager, teamName)

	platforms := make(map[string] *Platform)

	workDays := float64(calculateDatesDelta(manager.Config.StartDate, manager.Config.FinishDate) - len(manager.Config.Weekend) - 2)
	spPerIndex := team.SpPerDay * workDays

	var maxStoryPoints float64 = 0

	for _, teamUser := range team.Users {
		userSpIndex := (workDays - teamUser.DayOff) / workDays
		maxStoryPoints += userSpIndex * spPerIndex
		for plaftormName, platformValue := range teamUser.Platforms {
			if _, ok := platforms[plaftormName]; !ok {
				platforms[plaftormName] = createPlatform(plaftormName, plannedIssues, lostIssues)
			}
			platform := platforms[plaftormName]
			platform.MaxStoryPoints += platformValue * userSpIndex * spPerIndex
		}
	}

	unknownPlatform := findUnknownPlatform(platforms, plannedIssues, lostIssues)
	if (unknownPlatform !=  nil) {
		platforms[unknownPlatform.Name] = unknownPlatform
	}
    
    return PlanningInfo2 { 
    	Platforms: platforms,
    	MaxStoryPoints: maxStoryPoints,
    }, nil
}

func createPlatform(platformName string, plannedIssues []Issue, lostIssues []Issue) *Platform {
	var platformPlannedIssues []Issue = make([]Issue, 0)
	for _, issue := range plannedIssues {
		if (issue.Platform == platformName) {
			platformPlannedIssues = append(platformPlannedIssues, issue)
		}
	}
	var platformLostIssues []Issue = make([]Issue, 0)
	for _, issue := range lostIssues {
		if (issue.Platform == platformName) {
			platformLostIssues = append(platformLostIssues, issue)
		}
	}
	return &Platform {
		Name: platformName,
		PlannedIssues: platformPlannedIssues,
		LostIssues: platformLostIssues,
	}
}

func findUnknownPlatform(knownPlatforms map[string] *Platform, plannedIssues []Issue, lostIssues []Issue) *Platform {
	var unkownPlannedIssues []Issue = make([]Issue, 0)
	for _, issue := range plannedIssues {
		if _, ok := knownPlatforms[issue.Platform]; !ok {
			unkownPlannedIssues = append(unkownPlannedIssues, issue)
		}
	}
	var unknownLostIssues []Issue = make([]Issue, 0)
	for _, issue := range lostIssues {
		if _, ok := knownPlatforms[issue.Platform]; !ok {
			unknownLostIssues = append(unknownLostIssues, issue)
		}
	}
	if (len(unkownPlannedIssues) > 0 || len(unknownLostIssues) > 0) {
		return &Platform {
			MaxStoryPoints: 0.5,
			Name: "Unknown",
			PlannedIssues: unkownPlannedIssues,
			LostIssues: unknownLostIssues,
		}
	} else {
		return nil
	}
}

type PlanningInfo2 struct {
	MaxStoryPoints float64 `json:"maxStoryPoints"`
	Platforms map[string]*Platform `json:"platforms"`
}

type Platform struct {
    Name string `json:"name"`
	MaxStoryPoints float64 `json:"maxStoryPoints"`
	PlannedIssues []Issue `json:"plannedIssues"`
	LostIssues []Issue `json:"lostIssues"`
}