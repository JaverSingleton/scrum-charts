var Chart = {

  draw : function (sprint) {
    var groupedIssues = calculateCategories(sprint.issues)
    var categories = Object.keys(groupedIssues).sort()
    var categoriesIssues = categories.map(category => groupedIssues[category])
    var chart = new Highcharts.Chart({
      credits: {
        enabled: false
      },
      chart: {
          backgroundColor: 'rgba(0, 0, 0, 0)',
          renderTo: 'chart',
          type: 'bar',
          spacingBottom: 30,
          spacingTop: 65,
          spacingLeft: 10,
          spacingRight: 10
      },
      title: {
        text: '',
        x: -20 //center
      },
      subtitle: {
        text: '',
        x: -20
      },
      plotOptions: {
        series: {
          stacking: 'normal',
          animation: false
        }
      },
      xAxis: {
        categories: categories
      },
      yAxis: {
        title: {
            text: 'Story Points',
        }
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle',
        borderWidth: 0,
        reversed: true
      },
      tooltip: {
        formatter: function () {
          var resultStoryPoints = this.point.y
          if (this.point.issues.length > 0 & this.point.issues[0].isDone) {
            resultStoryPoints = 0 - resultStoryPoints
          }
          var s = '<b>' + resultStoryPoints + " (" + this.point.platform + ')</b>';

          if (this.point.issues) {
            this.point.issues.forEach(function(issue) {
              s += '<br/>'
              var storyPoints = 0
              if (issue.closeDate) {
                storyPoints -= issue.storyPoints
              } else {
                storyPoints += issue.storyPoints
              }
              s += (storyPoints)+ ": " + issue.key + " - " + issue.title;
            })
          }

          return s;
        }
      },
      series: [{
        color: 'rgb(252,98,103)',
        name: 'Backend',
        borderWidth: 1,
        data: calculateStories(categoriesIssues, "Backend", true)
      },{
        linkedTo:':previous',
        color: 'rgb(252,98,103)',
        name: 'Backend',
        borderWidth: 0,
        data: calculateStories(categoriesIssues, "Backend", false)
      }, {
        color: 'rgb(245,223,79)',
        name: 'Frontend',
        borderWidth: 1,
        data: calculateStories(categoriesIssues, "Frontend", true)
      }, {
        linkedTo:':previous',
        color: 'rgb(245,223,79)',
        name: 'Frontend',
        borderWidth: 0,
        data: calculateStories(categoriesIssues, "Frontend", false)
      }, {
        color: 'rgb(152,205,56)',
        name: 'Android',
        borderWidth: 1,
        data: calculateStories(categoriesIssues, "Android", true)
      }, {
        linkedTo:':previous',
        color: 'rgb(152,205,56)',
        name: 'Android',
        borderWidth: 0,
        data: calculateStories(categoriesIssues, "Android", false)
      }, {
        color: 'rgb(149,175,192)',
        name: 'iOS',
        borderWidth: 1,
        data: calculateStories(categoriesIssues, "iOS", true)
      }, {
        linkedTo:':previous',
        color: 'rgb(149,175,192)',
        name: 'iOS',
        borderWidth: 0,
        data: calculateStories(categoriesIssues, "iOS", false)
      }, {
        color: 'rgb(160,110,244)',
        name: 'QA-Dev',
        borderWidth: 1,
        data: calculateStories(categoriesIssues, "QA-Dev", true)
      }, {
        linkedTo:':previous',
        color: 'rgb(160,110,244)',
        name: 'QA-Dev',
        borderWidth: 0,
        data: calculateStories(categoriesIssues, "QA-Dev", false)
      }, {
        color: 'rgb(29,172,252)',
        name: 'QA',
        borderWidth: 1,
        data: calculateStories(categoriesIssues, "QA", true)
      }, {
        linkedTo:':previous',
        color: 'rgb(29,172,252)',
        name: 'QA',
        borderWidth: 0,
        data: calculateStories(categoriesIssues, "QA", false)
      }]
    });

    function calculateCategories(issues) {
      return issues
        .filter(issue => issue.key)
        .reduce(function (result, issue) {
            if (issue.parents.length == 0) {
              issue.parents.push("")
            }
            issue.parents.forEach(function(parent) {
              result[parent] = result[parent] || [];
              result[parent].push(issue);
            })
            return result;
        }, Object.create(null))
    }

    function calculateStories(categoriesIssues, category, isProgress) {
      var currentTime = new Date().getTime()
      return categoriesIssues.map(function(issues) {
        var filteredIssues = issues
          .filter(issue => issue.platforms.some(platform => platform == category))
          .filter(issue => !issue.isStory)
          .filter(issue => !issue.isDone)
          .filter(issue => (issue.isProgress || issue.isDone) == isProgress)
        var openedIssues = filteredIssues
          .filter(function (issue) { 
            var closeTime
            if (issue.closeDate != null) {
              closeTime = issue.closeDate.getTime()
            } else {
              closeTime = currentTime + 1
            }
            return closeTime > currentTime
          })
        var storyPoints = openedIssues
          .map(issue => issue.storyPoints)
          .reduce (function(result, storyPoints){
            return result + storyPoints
          }, 0)

        return { 
          issues: openedIssues,
          platform: category,
          y: storyPoints
        }
      })
    }

    function calculateYesterdayStories(categoriesIssues, category) {
      var today = new Date()
      var yesterday = new Date(new Date().setDate(new Date().getDate()-1))
      var currentHours = new Date().getHours()
      return categoriesIssues.map(function(issues) {
        var filteredIssues = issues
          .filter(issue => issue.platforms.some(platform => platform == category))
          .filter(issue => !issue.isStory)
          .filter(issue => issue.isDone)
          .filter(issue => issue.closeDate)
          .filter(issue => (issue.closeDate.toLocaleDateString("en-US") == yesterday.toLocaleDateString("en-US") && currentHours < 13 ) || issue.closeDate.toLocaleDateString("en-US") == today.toLocaleDateString("en-US"))

        var storyPoints = filteredIssues
          .map(issue => issue.storyPoints)
          .reduce(function(result, storyPoints){ return result + storyPoints }, 0)

        return { 
          issues: filteredIssues,
          platform: category,
          y: storyPoints
        }
      })
    }

  }

};