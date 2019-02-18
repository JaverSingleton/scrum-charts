package jira

import (
    "time"
    "sync"
	"log"

	"github.com/JaverSingleton/scrum-charts/config"
)

func NewJobManager() JobManager {
	return JobManager {
		Jobs: make(map[string]*SearchJob),
		lock: &sync.Mutex {},
	}
}

type JobManager struct {
	Config config.Config
	Credentials config.Credentials
	Jobs map[string]*SearchJob
	lock *sync.Mutex
	autoRefreshTicker *time.Ticker
}

type SearchJob struct {
	Jql string
	ExpiredDate time.Time
	LastResult Search
	lock *sync.Mutex
}

func (job *SearchJob) sendResult(search chan<- Search) {
	job.lock.Lock()
	search <- job.LastResult
	job.lock.Unlock()
}

func (manager *JobManager) refreshDate(job *SearchJob) {
	job.ExpiredDate = time.Now().Local().Add(time.Second * time.Duration(manager.Config.CacheLifetime))
}

func (manager *JobManager) AddJob(jql string, search chan<- Search) {
	manager.lock.Lock()
	defer manager.lock.Unlock()
	var result *SearchJob
	if job, ok := manager.Jobs[jql]; ok {
    	log.Println("Found Job")
		result = job
		result.sendResult(search)
	} else {
    	log.Println("Create Job")
		resultJob := SearchJob {
			Jql: jql,
			lock: &sync.Mutex {},
		}
		result = &resultJob
		manager.Jobs[jql] = &resultJob
		go manager.refreshAndSend(&resultJob, search)
	}
	manager.refreshDate(result)
}

func (manager *JobManager) StartAutoRefresh() {
	manager.StopAutoRefresh()
	seconds := manager.Config.RefreshFrequency
	if seconds == 0 {
		return
	}
    ticker := time.NewTicker(time.Second * time.Duration(seconds))
    manager.autoRefreshTicker = ticker
    for range ticker.C {
    	manager.RefreshAll()
    }
}

func (manager *JobManager) StopAutoRefresh() {
	if manager.autoRefreshTicker != nil {
		manager.autoRefreshTicker.Stop()
	}
}

func (manager *JobManager) RefreshAllWithWait() {
    var wg sync.WaitGroup
	manager.lock.Lock()
	defer manager.lock.Unlock()
	for key, job := range manager.Jobs { 
		if (time.Now().Before(job.ExpiredDate)) {
    		log.Println("Refresh Job", job.Jql)
    		wg.Add(1)
			go manager.refreshWithWait(job, &wg)
		} else {
    		log.Println("Remove Job", job.Jql)
			delete (manager.Jobs, key)
		}
	}
	wg.Wait()
}

func (manager *JobManager) ClearJobs() {
	manager.lock.Lock()
	defer manager.lock.Unlock()
	manager.Jobs = make(map[string]*SearchJob)
}

func (manager *JobManager) RefreshAll() {
	manager.lock.Lock()
	defer manager.lock.Unlock()
	for key, job := range manager.Jobs { 
		if (time.Now().Before(job.ExpiredDate)) {
    		log.Println("Refresh Job", job.Jql)
			go manager.refresh(job)
		} else {
    		log.Println("Remove Job", job.Jql)
			delete (manager.Jobs, key)
		}
	}
}

func (manager *JobManager) refreshWithWait(job *SearchJob, wg *sync.WaitGroup) {
	manager.refresh(job)
	wg.Done()
}

func (manager *JobManager) refreshAndSend(job *SearchJob, search chan<- Search) {
	manager.refresh(job)
	job.sendResult(search)
}

func (manager *JobManager) refresh(job *SearchJob) {
	job.lock.Lock()
	if search, err := FindByJql(manager.Config, manager.Credentials, job.Jql); err == nil {
		job.LastResult = search
	} else {
		job.LastResult = Search {}
	}
	job.lock.Unlock()
}