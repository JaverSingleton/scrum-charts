var Chart = {

  draw : function (sprint) {
    var sprintIssues = sprint.issues
        .filter(issue => !issue.isStory)
    var categories = ["Backend", "Frontend", "Android", "iOS", "QA"]
    var groupIssues = categories
        .map(category => calculateStories(sprintIssues, category))
    var summary = calculateSummary(groupIssues)
    var idealPercent = calculateIdealPercent(sprint.dates, sprint.weekend)
    var chart = new Highcharts.Chart({
      credits: {
        enabled: false
      },
      chart: {
          backgroundColor: 'rgba(0, 0, 0, 0)',
          renderTo: 'chart',
          type: 'column',
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
        },
        column: {
            colorByPoint: true,
            borderWidth: 0
        }
      },
      xAxis: {
        categories: ["Общий"].concat(categories)
      },
      yAxis: {
        title: {
            text: '%',
        },
        plotLines: [{
          value: idealPercent,
          color: 'rgb(129,236,236)',
          dashStyle: 'LongDash',
          width: 1
        }],
        min: 0, 
        max: 100
      },
      colors: [
        'rgb(242,148,63)',
        'rgb(252,98,103)',
        'rgb(160,110,244)',
        'rgb(152,205,56)',
        'rgb(149,175,192)',
        'rgb(29,172,252)',
      ],
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle',
        borderWidth: 0,
        reversed: true
      },
      tooltip: {
        formatter: function () {
          var percent = this.point.y
          var s = '<b>' + percent + "% (" + this.point.platform + ')</b>';

          if (this.point.issues) {
            this.point.issues.forEach(function(issue) {
              s += '<br/>'
              s += issue.storyPoints + ": " + issue.name();
            })
          }

          return s;
        }
      },
      series: [{
        showInLegend: false,
        data: [summary].concat(groupIssues)
      }]
    });

    function calculateStories(issues, category) {
      var allIssues = issues
        .filter(issue => issue.platforms.some(platform => platform == category))
      var closedIssues = allIssues
        .filter(function (issue) { 
          return issue.closeDate != null || issue.isDone
        })
        
      var allStoryPoints = allIssues
        .map(issue => issue.storyPoints)
        .reduce (function(result, storyPoints){
          return result + storyPoints
        }, 0)
      var storyPoints = closedIssues
        .map(issue => issue.storyPoints)
        .reduce (function(result, storyPoints){
          return result + storyPoints
        }, 0)

      var percent = 100.0
      if (allStoryPoints > 0) {
        percent = storyPoints / allStoryPoints * 100
      }

      return { 
          issues: closedIssues,
          platform: category,
          y: percent
        }
    }

    function calculateStories(issues, category) {
      var allIssues = issues
        .filter(issue => issue.platforms.some(platform => platform == category))
      var closedIssues = allIssues
        .filter(function (issue) { 
          return issue.closeDate != null || issue.isDone
        })
        
      var allStoryPoints = allIssues
        .map(issue => issue.storyPoints)
        .reduce (function(result, storyPoints){
          return result + storyPoints
        }, 0)
      var storyPoints = closedIssues
        .map(issue => issue.storyPoints)
        .reduce (function(result, storyPoints){
          return result + storyPoints
        }, 0)

      var percent = 100.0
      if (allStoryPoints > 0) {
        percent = storyPoints / allStoryPoints * 100
      }

      return { 
          allIssues: allIssues,
          issues: closedIssues,
          platform: category,
          y: percent
        }
    }

    function calculateSummary(groupIssues) {
      var sortedIssues = groupIssues.map(function(group, index) {
        var issues = group.issues
        var storyPoints = issues
          .map(issue => issue.storyPoints)
          .reduce (function(result, storyPoints){ return result + storyPoints }, 0)
        return {
          name: function() { return categories[index] },
          storyPoints: storyPoints
        }
      })
      var allStoryPoints = groupIssues.map(function(group) {
        var issues = group.allIssues
        return issues
          .map(issue => issue.storyPoints)
          .reduce (function(result, storyPoints){ return result + storyPoints }, 0)
      }).reduce (function(result, storyPoints){ return result + storyPoints }, 0)

      var storyPoints = sortedIssues
        .map(issue => issue.storyPoints)
        .reduce (function(result, storyPoints){
          return result + storyPoints
        }, 0)

      var percent = 100.0
      if (allStoryPoints > 0) {
        percent = storyPoints / allStoryPoints * 100
      }

      return { 
        issues: sortedIssues,
        platform: "Общий",
        y: percent
      }
    }

    function calculateIdealPercent(dates, weekend) {
      var today = new Date()
      var todayTime = today.getTime()
      var workDaysCount = dates.length - weekend.length;
      var doneDatesCount = dates
        .filter(date => date.getTime() <= todayTime)
        .filter(date => !weekend.some(weekendDay => date.getTime() == weekendDay.getTime()))
        .map(function(date){
          if (date.toLocaleDateString("en-US") == today.toLocaleDateString("en-US")){
            return today.getHours() / 24.0
          } else {
            return 1.0
          }
        })
        .reduce (function(result, value){ return result + value }, 0)
      return doneDatesCount / workDaysCount * 100
    }

  }

};