var Bar = {

  draw : function (platforms, maxStoryPoints, selectedPlatform) {
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

    var items = createItems(platforms)
    var storyPoints = items
            .map(item => item.storyPoints)
            .reduce (function(result, storyPoints){
              return result + storyPoints
            }, 0)
    var category = "Total SP"
    if (storyPoints < maxStoryPoints * 0.9 || storyPoints > maxStoryPoints * 1.15) {
      category += " ⚠️"
    }
    var chart = new Highcharts.Chart({
      credits: {
        enabled: false
      },
      chart: {
          backgroundColor: 'rgba(0, 0, 0, 0)',
          renderTo: 'bar',
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
        categories: [category],
        gridLineColor: 'transparent'
      },
      yAxis: {
        stackLabels: {
          enabled: true,
            style: {
            color: '#DDD',
            font: 'bold 12px Lucida Grande, Lucida Sans Unicode,' +
                ' Verdana, Arial, Helvetica, sans-serif'
            }
        },
        gridLineColor: 'transparent',
        title: {
            text: ' '
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
        max: maxStoryPoints * 1.5,
      step: true,
        labels:{
          enabled: false
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
            isActive: category == selectedPlatform || selectedPlatform == null
          }
        }
      ) 
    }

    function generateValues(items) {
      return items.map(function(item, index) {
          var colors = inactivePlatformColors
          if (selectedPlatform == null) {
            colors = platformColors
          }
          return { 
            y: item.storyPoints,
            x: 0,
            item: item,
            color: colors[item.platform],
            events: {
              click: function() {
                  window.location.href = $.query.set("platform", "")
              }
            }
          }
        }
      ) 
    }

  }

};