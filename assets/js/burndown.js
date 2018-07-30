var Chart = {

  draw : function (sprint) {
    var maxPoints = sprint.issues
      .map (issue => issue.storyPoints) 
      .reduce(function(result, storyPoints) { return result + storyPoints }, 0)
    var idealChart = calculateIdealChart(maxPoints, sprint.dates, sprint.weekend)
    var actualChart = calculateActualChart(maxPoints, sprint.dates, sprint.issues)
    var weekendPeriods = calculateWeekendPeriods(sprint.dates, sprint.weekend)
    var chart = new Highcharts.Chart({
      chart: {
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
        categories: sprint.dates.map(function(date) { 
          return date.getDate()
        }),
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
        }
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle',
        borderWidth: 0
      },
      series: [{
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
          return maxPoints - workDayIndex * perDay
        })
    }

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
          return maxPoints - workDayIndex * perDay
        })
    }

    function calculateActualChart(maxPoints, dates, issues) {
      var currentPoints = maxPoints
      var currentDate = new Date()
      var currentTime = currentDate.getTime()
      var workDates = dates.filter( date => date.getTime() <= currentTime)
      return workDates.map (function(date, index) {
        currentPoints -= issues
            .filter (function (issue) { 
              var closeTime
              if (issue.closeDate != null && issue.isDone) {
                closeTime = issue.closeDate.getTime()
              } else {
                closeTime = 0
              }
              return closeTime == date.getTime()
            })
            .map (issue => issue.storyPoints)
            .reduce (function(result, storyPoints){
              return result + storyPoints
            }, 0)
            
          if (index == workDates.length - 1) {
            return {  
              marker: {
                lineWidth: 2,
                lineColor: "#1df8fc"  
              },
              y: currentPoints
            }
          } else {
            return currentPoints
          }
        })
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

  }

};