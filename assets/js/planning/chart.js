var Chart = {

  draw : function (users, maxStoryPoints, selectedUser) {
    var platformColors = {
      'Backend': 'rgb(252,98,103)',
      'Frontend': 'rgb(245,223,79)',
      'Android': `rgb(152,205,56)`,
      'iOS': `rgb(149,175,192)`,
      'QA-Dev': `rgb(160,110,244)`,
      'QA': `rgb(29,172,252)`
    }
    var inactivePlatformColors = {
      'Backend': 'rgba(252,98,103,0.5)',
      'Frontend': 'rgba(245,223,79,0.5)',
      'Android': `rgba(152,205,56,0.5)`,
      'iOS': `rgba(149,175,192,0.5)`,
      'QA-Dev': `rgba(160,110,244,0.5)`,
      'QA': `rgba(29,172,252,0.5)`
    }
    var categories = Object.keys(users).sort()
    var categoriesIssues = categories.map(function(category) {
        return {
          issues: users[category].plannedIssues,
          assignee: category
        }
      }
    ) 
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
        },
        plotBands: [{
            color: 'rgba(64, 64, 64, 0.7)',
            from: maxStoryPoints * 0.9,
            to: maxStoryPoints * 1.15
        }],
        plotLines: [{
          value: maxStoryPoints,
          color: 'rgb(129,236,236)',
          dashStyle: 'LongDash',
          width: 1.5
        }],
        min: 0, 
        max: maxStoryPoints * 1.5
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

          // if (this.point.issues) {
          //   this.point.issues.forEach(function(issue) {
          //     s += '<br/>'
          //     var storyPoints = 0
          //     if (issue.closeDate) {
          //       storyPoints -= issue.storyPoints
          //     } else {
          //       storyPoints += issue.storyPoints
          //     }
          //     s += (storyPoints)+ ": " + issue.key + " - " + issue.name;
          //   })
          // }

          return s;
        }
      },
      series: [{
        color: platformColors["Backend"],
        name: 'Backend',
        borderWidth: 0,
        data: getPlatformIssues(categoriesIssues, "Backend")
      }, {
        color: platformColors["Frontend"],
        name: 'Frontend',
        borderWidth: 0,
        data: getPlatformIssues(categoriesIssues, "Frontend")
      }, {
        color: platformColors["Android"],
        name: 'Android',
        borderWidth: 0,
        data: getPlatformIssues(categoriesIssues, "Android")
      }, {
        color: platformColors["iOS"],
        name: 'iOS',
        borderWidth: 0,
        data: getPlatformIssues(categoriesIssues, "iOS")
      }, {
        color: platformColors["QA"],
        name: 'QA',
        borderWidth: 0,
        data: getPlatformIssues(categoriesIssues, "QA")
      }, {
        color: platformColors["QA-Dev"],
        name: 'QA-Dev',
        borderWidth: 0,
        data: getPlatformIssues(categoriesIssues, "QA-Dev")
      }]
    });

    function getPlatformIssues(categoriesIssues, platform) {
      return categoriesIssues.map(function(assigneeWithIssues) {
        var issues = assigneeWithIssues.issues
        var assignee = assigneeWithIssues.assignee
        var filteredIssues = issues
          .filter(issue => issue.platform == platform)
        var storyPoints = filteredIssues
          .map(issue => issue.storyPoints)
          .reduce (function(result, storyPoints){
            return result + storyPoints
          }, 0)

        var color = inactivePlatformColors[platform]
        if (assignee == selectedUser || selectedUser == null) {
          color = platformColors[platform]
        }

        return { 
          issues: filteredIssues,
          platform: platform,
          y: storyPoints,
          assignee: assignee,
          color: color,
          events: {
            click: function() {
              if (this.assignee == selectedUser) {
                window.location.href = $.query.set("assignee", "")
              } else {
                window.location.href = $.query.set("assignee", this.assignee)
              }
            }
          }
        }
      })
    }

  }

};