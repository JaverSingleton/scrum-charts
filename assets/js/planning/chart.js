var Chart = {

  draw : function (issues, maxStoryPoints) {
    var chart = new Highcharts.Chart({
      credits: {
        enabled: false
      },
      chart: {
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
        title: {
            text: 'Issues',
        }
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

          if (this.point.issues) {
            this.point.issues.forEach(function(issue) {
              s += '<br/>'
              var storyPoints = 0
              if (issue.closeDate) {
                storyPoints -= issue.storyPoints
              } else {
                storyPoints += issue.storyPoints
              }
              s += (storyPoints)+ ": " + issue.key + " - " + issue.name;
            })
          }

          return s;
        }
      },
      series: [{
        color: 'rgb(252,98,103)',
        name: 'Backend',
        borderWidth: 0,
        data: getPlatformIssues(issues, "Backend")
      }, {
        color: 'rgb(160,110,244)',
        name: 'Frontend',
        borderWidth: 0,
        data: getPlatformIssues(issues, "Frontend")
      }, {
        color: 'rgb(152,205,56)',
        name: 'Android',
        borderWidth: 0,
        data: getPlatformIssues(issues, "Android")
      }, {
        color: 'rgb(149,175,192)',
        name: 'iOS',
        borderWidth: 0,
        data: getPlatformIssues(issues, "iOS")
      }, {
        color: 'rgb(29,172,252)',
        name: 'QA',
        borderWidth: 0,
        data: getPlatformIssues(issues, "QA")
      }, {
        color: 'rgb(29,172,252)',
        name: 'QA-Dev',
        borderWidth: 0,
        data: getPlatformIssues(issues, "QA-Dev")
      }]
    });

    function getPlatformIssues(issues, category) {
      var currentTime = new Date().getTime()
      var filteredIssues = issues
          .filter(issue => issue.platform == category)
      var storyPoints = filteredIssues
        .map(issue => issue.storyPoints)
        .reduce (function(result, storyPoints){
          return result + storyPoints
        }, 0)

      return [{ 
        issues: filteredIssues,
        platform: category,
        y: storyPoints
      }]
    }

  }

};