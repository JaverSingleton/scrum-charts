var Chart = {

  draw : function (sprint) {
    var maxPoints = sprint.issues
      .map (issue => issue.storyPoints) 
      .reduce(function(result, storyPoints) { return result + storyPoints }, 0)
    var idealChart = calculateIdealChart(maxPoints, sprint.dates, sprint.weekend)
    var actualChartDatas = calculateActualChartData(maxPoints, sprint.dates, sprint.issues)
    var remainingStoryPoints = maxPoints
    if (actualChartDatas.length > 0) {
      remainingStoryPoints = actualChartDatas[actualChartDatas.length - 1].remainingStoryPoints
    }
    var actualChart = convertToPoints(actualChartDatas)
    var average = calculateAverage(actualChartDatas, maxPoints, sprint.weekend)
    var idealAverage = calculateIdealAverage(remainingStoryPoints, sprint.dates, sprint.weekend)
    var averageChart = calculateAverageChart(average, sprint.dates, sprint.weekend, idealAverage)
    var weekendPeriods = calculateWeekendPeriods(sprint.dates, sprint.weekend)
    var chart = new Highcharts.Chart({
      credits: {
        enabled: false
      },
      chart: {
          backgroundColor: 'rgba(0, 0, 0, 0)',
          renderTo: 'chart',
          spacingBottom: 30,
          spacingTop: 65,
          spacingLeft: 10,
          spacingRight: 10,
          animation: false
      },
      plotOptions: {
        area: {
          fillOpacity: 0.5
        },
        series: {
          animation: false
        }
      },
      title: {
        text: '',
        x: -20
      },
      subtitle: {
        text: '',
        x: -20
      },
      xAxis: {
        categories: sprint.dates.map(date => date.getDate()),
        plotBands: weekendPeriods.map(function(period) {
          return {
            color: 'rgba(64, 64, 64, 0.2)',
            from: period.start,
            to: period.finish
          }
        })
      },
      yAxis: {
        title: {
            text: 'Story Points',
        },
        tickInterval: 5,
        min: 0
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle',
        borderWidth: 0
      },
      tooltip: {
        formatter: function () {
          var s = ""
          var actual = actualChart[this.points[0].point.x]
          var ideal = idealChart[this.points[0].point.x]

          if (actual) {
            s = '<b>' + actual.y.toFixed(1) + " (Ideal: " + ideal.toFixed(1) + ')</b>';
          } else {
            s = '<b>' + "Ideal: " + ideal.toFixed(1) + '</b>';
          }

          this.points.forEach(function(point){
            if (point.point.issues) {
              point.point.issues.forEach(function(issue) {
                s += '<br/>'

                if (issue.isStory) {
                  s += '✅'
                } else {
                  s += issue.storyPoints
                }
                s += ": " + issue.name()
              })
            }
          })

          return s;
        },
        shared: true
      },
      series: [{
        showInLegend: false,
        lineWidth: 1,
        marker: {
          radius: 0
        },
        enableMouseTracking: false,
        dashStyle: 'LongDash',
        color: 'rgb(129,236,236)',
        name: 'Average',
        data: averageChart
      }, {
        showInLegend: false,
        lineWidth: 2,
        marker: {
          radius: 6,
          fillColor: '#98cd38',
          symbol: 'circle'
        },
        color: '#98cd38',
        name: 'Ideal',
        data: idealChart
      }, {
        showInLegend: false,
        lineWidth: 2,
        marker: {
          radius: 6,
          fillColor: '#1dacfc',
          symbol: 'circle'
        },
        color: '#1dacfc',
        name: 'Actual',
        data: actualChart
      }]
    });

    function calculateIdealChart(maxPoints, dates, weekend) {
      var workDaysCount = dates.length - weekend.length;
      var perDay = maxPoints / workDaysCount;
      var workDayIndex = 0
      return dates
        .map (function(date) {
          var index = workDayIndex
          if (!weekend.some(weekendDay => date.getTime() == weekendDay.getTime())) {
            workDayIndex++
          }
          return Math.max(0, maxPoints - workDayIndex * perDay)
        })
    }

    function calculateActualChartData(maxPoints, dates, issues) {
      var currentPoints = maxPoints
      var currentDate = new Date()
      var currentTime = currentDate.getTime()
      var workDates = dates.filter( date => date.getTime() <= currentTime)
      return workDates.map (function(date, index) {
        var closedIssues = issues
            .filter (function (issue) { 
              var closeTime
              if (issue.closeDate != null && issue.isDone) {
                closeTime = issue.closeDate.getTime()
              } else {
                closeTime = 0
              }
              return closeTime == date.getTime()
            })
        currentPoints -= closedIssues
            .map (issue => issue.storyPoints)
            .reduce (function(result, storyPoints){
              return result + storyPoints
            }, 0)
            
          return {  
              issues: closedIssues,
              date: date,
              remainingStoryPoints: currentPoints
            }
        })
    }

    function convertToPoints(chartDatas) {
      var currentDate = new Date()
      return chartDatas.map(function(data, index) {
        var date = data.date
        if (isToday(date)) {
            return {  
              issues: data.issues,
              marker: {
                lineWidth: 2,
                lineColor: "#1df8fc"  
              },
              y: data.remainingStoryPoints
            }
          } else {
            return {  
              issues: data.issues,
              y: data.remainingStoryPoints
            }
          }
      })
    }

    function calculateAverage(chartDatas, maxStoryPoints, weekend) {
      var prevStoryPoints = maxStoryPoints
      var deltaStoryPointsList = chartDatas
        .filter(function(data) { return !weekend.some(weekendDay => data.date.getTime() == weekendDay.getTime()) })
        .map(function(data, index) {
          var deltaStoryPoints = prevStoryPoints - data.remainingStoryPoints
          prevStoryPoints = data.remainingStoryPoints
          return deltaStoryPoints
        })
      return deltaStoryPointsList.reduce(function(a, b) { return a + b }, 0) / deltaStoryPointsList.length
    }

    function calculateIdealAverage(remainingStoryPoints, dates, weekend) {
      var currentDate = new Date()
      var currentTime = currentDate.getTime()
      var workDaysCount = dates
        .filter(date => isLaterOrToday(date))
        .filter(function(date) { return !weekend.some(weekendDay => date.getTime() == weekendDay.getTime()) })
        .length
      return remainingStoryPoints / workDaysCount
    }

    function calculateAverageChart(average, dates, weekend, idealAverage) {
      var workDaysCount = dates.length - weekend.length;
      var perDay = average;
      var workDayIndex = 0
      var currentDate = new Date()
      var currentTime = currentDate.getTime()
      return dates
        .map (function(date, position) {
          var index = workDayIndex
          if (!weekend.some(weekendDay => date.getTime() == weekendDay.getTime())) {
            workDayIndex++
          }
          var value = maxPoints - workDayIndex * perDay
          var needToShow = isLaterOrToday(date)
          if (position == dates.length - 1) {
            return {
              dataLabels: {
                enabled: true,
                align: 'left',
                style: {
                  color: '#DDD',
                  font: 'bold 12px Lucida Grande, Lucida Sans Unicode,' +
                      ' Verdana, Arial, Helvetica, sans-serif'
                },
                useHTML: true,
                formatter: function() { 
                  var hint = "Идеальная скорость " + idealAverage.toFixed(1) + " SP в день"
                  return `<p title="` + hint + `">` + this.y.toFixed(0) + `</p>` 
                },
                x: 3,
                verticalAlign: 'middle',
                overflow: true,
                crop: false
              },
              needToShow: needToShow,
              y: value,
              x: position
            }
          }
          return {
            needToShow: needToShow,
            y: value,
            x: position
          }
        })
        .filter(point => point.needToShow)
    }

    function calculateWeekendPeriods(dates, weekend) {
      var weekendPeriods = []
      var count = 0
      dates.forEach(function(date, index) {
        if (weekend.some(weekendDay => date.getTime() == weekendDay.getTime())) {
          count++
        } else if (count > 0) {
          weekendPeriods.push(
            {
              start: index - 1 - count,
              finish: index - 1
            }
          )
          count = 0
        }
      })
      return weekendPeriods
    }

    function isLaterOrToday(date) {
      var currentDate = new Date()
      return date.getTime() >= currentDate.getTime() || isToday(date)
    }

    function isToday(date) {
      var currentDate = new Date()
      return currentDate.getDate() == date.getDate() && currentDate.getMonth() == date.getMonth()
    }

  }

};