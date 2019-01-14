var Chart = {

  draw : function (platforms, maxStoryPoints, selectedPlatform) {
    var platformColors = {
      'Backend': 'rgb(252,98,103)',
      'Frontend': 'rgb(245,223,79)',
      'Android': `rgb(152,205,56)`,
      'iOS': `rgb(149,175,192)`,
      'QA-Dev': `rgb(160,110,244)`,
      'QA': `rgb(29,172,252)`,
      'Unknown': `rgba(29,172,252)`
    }
    var inactivePlatformColors = {
      'Backend': 'rgba(252,98,103,0.5)',
      'Frontend': 'rgba(245,223,79,0.5)',
      'Android': `rgba(152,205,56,0.5)`,
      'iOS': `rgba(149,175,192,0.5)`,
      'QA-Dev': `rgba(160,110,244,0.5)`,
      'QA': `rgba(29,172,252,0.5)`,
      'Unknown': `rgba(29,172,252,0.5)`
    }

    var items = createItems(platforms)
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
        categories: generateCategories(items)
      },
      yAxis: {
        title: {
            text: 'Story Points',
        },
        plotBands: [{
            color: 'rgba(64, 64, 64, 0.7)',
            from: 99.5,
            to: 100.5
        }],
        plotLines: [{
          value: 100,
          color: 'rgb(129,236,236)',
          dashStyle: 'LongDash',
          width: 1.5
        }],
        min: 0, 
        max: 150,
        labels:{
            enabled:false,
            width: 1000
        }
      },
      legend: {
        enabled: false
      },
      tooltip: {
        formatter: function () {
          return '<b>' + this.point.item.storyPoints + ' из ' + this.point.item.maxStoryPoints + '</b>';
        }
      },
      series: [{
        borderWidth: 0,
        data: generateValues(items)
      }]
    });

    function createItems(platforms) {
      var categories = Object.keys(platforms)

      return categories.map(function(category) {
          var storyPoints = platforms[category].plannedIssues
            .map(issue => issue.storyPoints)
            .reduce (function(result, storyPoints){
              return result + storyPoints
            }, 0)

          return {
            platform: category,
            issues: platforms[category].plannedIssues,
            storyPoints: storyPoints,
            maxStoryPoints: platforms[category].maxStoryPoints,
            isActive: category == selectedPlatform
          }
        }
      ) 
    }

    function generateCategories(items) {
      return items.map(function(item) {
          var postfix = ""
          if (item.storyPoints > item.maxStoryPoints) {
            postfix = " ⚠️"
          }
          return item.platform + postfix
        }
      ) 
    }

    function generateValues(items) {
      return items.map(function(item) {
          var color = inactivePlatformColors[item.platform]
          if (item.platform == selectedPlatform) {
            color = platformColors[item.platform]
          }
          return { 
            y: item.storyPoints / item.maxStoryPoints * 100,
            item: item,
            color: color,
            events: {
              click: function() {
                if (this.item.platform == selectedPlatform) {
                  window.location.href = $.query.set("platform", "")
                } else {
                  window.location.href = $.query.set("platform", this.item.platform)
                }
              }
            }
          }
        }
      ) 
    }

  }

};