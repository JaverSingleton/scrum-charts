var interval = function () {
	var params = {
		team: teamParam,
		code: codeParam
	}
    $.get("sprint", params)
    	.done(function(data){
	    	var sprint = convertToSprint(data);
		    Chart.draw(sprint);
	    })
		.fail(function(data) {
			console.log(data);
		});
};
interval();
setInterval(interval, 60000)