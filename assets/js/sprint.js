function convertToSprint(sprintInfo) {
	var sprint = {
		name: "",
		dates: [],
	    weekend: [],
	    issues: {},
		code: 0
	};

	sprint.dates = getDates(
		new Date(sprintInfo.startDate), 
		new Date(sprintInfo.finishDate)
	);
	sprint.weekend = sprintInfo.weekend.map(function(dateString) {
	  return new Date(dateString);
	});
	sprint.code = sprintInfo.code;
	sprint.name = sprintInfo.name;
	sprint.issues = sprintInfo.issues;
	sprint.issues.forEach(function(issue) {
		if(issue.closeDate) {
			issue.closeDate = new Date(issue.closeDate)
		} else {
			issue.closeDate = null
		}
		if(!issue.parents) {
			issue.parents = []
		}
		issue.name = function() {
			return this.key + " - " + this.title
		}
	})
	return sprint;
}

function getDates (startDate, finishDate) {
  var dates = [],
      currentDate = startDate,
      addDays = function(days) {
        var date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
      };
  while (currentDate <= finishDate) {
    dates.push(currentDate);
    currentDate = addDays.call(currentDate, 1);
  }
  return dates;
}