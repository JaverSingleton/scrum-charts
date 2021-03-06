package jira

import (
	"net/http"
	"encoding/json"
    "net/url"
    "io/ioutil"
	"log"
    "time"

	"github.com/JaverSingleton/scrum-charts/config"
)

func FindByJql(config config.Config, credentials config.Credentials, jql string) (Search, error) {
	var Url *url.URL
    Url, err := url.Parse("https://jr.avito.ru")
    if err != nil {
    	return Search {}, err
    }

    Url.Path += "/rest/api/2/search"
    parameters := url.Values{}
    parameters.Add("jql", jql)
    parameters.Add("maxResults", "500")
    Url.RawQuery = parameters.Encode()

    log.Println("Create Request:", Url.String())
	req, err := http.NewRequest("GET", Url.String(), nil)
	if (err != nil) {
    	return Search {}, err
	}
    req.Header.Add("Authorization","Basic " + credentials.GetBasicAuth())
	client := &http.Client {}
    log.Println("Do Request:", Url.String())
	response, err := client.Do(req)
    if err != nil{
        log.Println("Do Request - Failure:", err)
    	return Search {}, err
    }
    defer response.Body.Close()
    log.Println("Read Body")
    contents, err := ioutil.ReadAll(response.Body)
    if response.StatusCode != 200 {
        log.Println("Do Request - Failure:", "Code = ", response.StatusCode)
        return Search {}, err
    }
    if err != nil {
        log.Println("Read Body - Failure:", err)
    	return Search {}, err
    }
    var search = Search {
        RequestDate: time.Now().Local(),
    	ExpiredDate: time.Now().Local().Add(time.Second * time.Duration(config.CacheLifetime)),
    }
    log.Println("Umarshal JSON")
	if err = json.Unmarshal(contents, &search); err != nil {
        log.Println("Umarshal JSON - Failure:", err)
		return Search {}, err
	}
	return search, nil
}

type Search struct {
    Expand string `json:"expand"`
    Issues []Issue `json:"issues"`
    MaxResults int `json:"maxResults"`
    StartAt int `json:"startAt"`
    Total int `json:"total"`
    ExpiredDate time.Time `json:"expiredDate"`
	RequestDate time.Time `json:"requestDate"`
}

type Issue struct {
    Id string `json:"id"`
    Key string `json:"key"`
    Fields JiraFields `json:"fields"`
}

type JiraFields struct {
    Customfield_10212 *float64 `json:"customfield_10212"`
    Resolutiondate string `json:"resolutiondate"`
    Summary string `json:"summary"`
    Issuetype JiraType `json:"issuetype"`
    Status JiraStatus `json:"status"`
    Issuelinks []JiraLink `json:"issuelinks"`
    Epic string `json:"customfield_10216"`
    Labels []string `json:"labels"`
    Components []JiraComponent `json:"components"`
    Subtasks []Issue `json:"subtasks"`
    Parent JiraParent `json:"parent"`
    Assignee JiraUser `json:"assignee"`
}

type JiraUser struct {
    Name string `json:"name"`
}

type JiraType struct {
    Id string `json:"id"`
    Name string `json:"name"`
}

type JiraLink struct {
    Id string `json:"id"`
    Type JiraType `json:"type"`
    OutwardIssue Issue `json:"outwardIssue"`
    InwardIssue Issue `json:"inwardIssue"`
}

type JiraComponent struct {
    Id string `json:"id"`
    Name string `json:"name"`
}

type JiraStatus struct {
    Id string `json:"id"`
    Name string `json:"name"`
    Category JiraStatusCategory `json:"statusCategory"`
}

type JiraStatusCategory struct {
    Id int `json:"id"`
    Key string `json:"key"`
    Name string `json:"name"`
}

type JiraParent struct {
    Id string `json:"id"`
    Key string `json:"key"`
}
