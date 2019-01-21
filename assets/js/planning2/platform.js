var Chart = {

  draw : function (id, name, platform, maxStoryPoints, color, clickListener) {
    var item = createItem(platform, name)
    var chart = new Highcharts.Chart({
      credits: {
        enabled: false
      },
      chart: {
          backgroundColor: 'rgba(0, 0, 0, 0)',
          renderTo: id,
          type: 'bar',
          spacingTop: -5,
          spacingBottom: -5,
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
        categories: [generateCategory(item)],
        labels: {
            useHTML:true,
            style:{
                whiteSpace:'normal'
            },
            formatter: function () {
                return '<div style="width:70px;">' + this.value + '</div>';
            }
        },
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
        title: {
            text: '',
        },
        plotBands: [{
            color: 'rgba(64, 64, 64, 0.7)',
            from: item.maxCommonStoryPoints,
            to: item.maxCommonStoryPoints + item.maxEasyStoryPoints
        }],
        plotLines: [{
          value: item.maxCommonStoryPoints,
          color: 'rgb(129,236,236)',
          dashStyle: 'LongDash',
          width: 1.5
        }],
        min: 0, 
        max: maxStoryPoints * 1.1,
        labels:{
            enabled:false
        }
      },
      legend: {
        enabled: false
      },
      tooltip: {
        enabled: false
      },
      series: generateValues(item, color)
    });

    function createItem(platform, name) {
      var commonStoryPoints = platform.plannedIssues
        .filter(issue => !issue.isEasy)
        .map(issue => issue.storyPoints)
        .reduce (function(result, storyPoints){
          return result + storyPoints
        }, 0)
      var easyStoryPoints = platform.plannedIssues
        .filter(issue => issue.isEasy)
        .map(issue => issue.storyPoints)
        .reduce (function(result, storyPoints){
          return result + storyPoints
        }, 0)

      return {
        platform: name,
        issues: platform.plannedIssues,
        commonStoryPoints: commonStoryPoints,
        easyStoryPoints: easyStoryPoints,
        maxCommonStoryPoints: platform.maxCommonStoryPoints,
        maxEasyStoryPoints: platform.maxEasyStoryPoints
      }
    }

    function generateCategory(item) {
      var postfix = ""
      var hint = ""
      if (item.commonStoryPoints > item.maxCommonStoryPoints) {
        postfix = " ⚠️"
        hint = "Обучающиеся разработчики могут брать только Easy задачи. " + 
          "Может возможно превратит " + (item.commonStoryPoints - item.maxCommonStoryPoints) + " SP в Easy?"
      }
      var storyPoints = item.commonStoryPoints + item.easyStoryPoints
      var maxStoryPoints = item.maxCommonStoryPoints + item.maxEasyStoryPoints
      if (storyPoints > maxStoryPoints) {
        postfix = " ⚠️"
        hint = "Кол-во SP больше положенного. " + "Уберите " + (storyPoints - maxStoryPoints) + " SP"
      }
      return `<p title="` + hint + `">` + name + postfix + `</p>` 
    }

    function generateValues(item, color) { 
      return [
        {
          data: [ item.easyStoryPoints ],
          color: color,
          borderWidth: 1,
          events: {
            click: function() {
              clickListener(item.platform)
            }
          }
        },
        { 
          data: [ item.commonStoryPoints ],
          color: color,
          borderWidth: 0,
          events: {
            click: function() {
              clickListener(item.platform)
            }
          }
        }
      ]
    }
  }

};