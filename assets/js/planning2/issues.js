var Table = {

	strikeResolved: function(text, issue) {
		if (issue.isResolved) {
			return '<s>' + text + '</s>'
		} else {
			return text
		}
	},

	link: function(text, uri, hint = "") {
		return '<a href="' + uri + '" target="_blank" title="' + hint + '"">' + text + '</a>'
	},

	warning: function(text = "") {
		if (text == "") {
			return "⚠️"
		} else {
			return text + " ⚠️"
		}
		return 
	},

	task: function(issue) {
		var text = ""
		if (issue.outSprint && !issue.isResolved) {
			text +=  this.warning(issue.key)
		} else {
			text += issue.key
		}
		text = this.strikeResolved(text, issue)
		return this.column(this.link(text, issue.uri, issue.platform))
	},

	column: function(text) {
		var html = '<td>'

		html += text

		html += '</td>'
		return html
	},

	rowEpic: function(issue, spanCount) {
		var html = '<tr>'

		var name = issue.name
		if (issue.outSprint) {
			name = Table.warning(issue.key)
		}

		html += '<td colspan="' + spanCount + '" align="center">'
		html += Table.link("<b>" + Table.strikeResolved(name, issue) + "</b>", issue.uri)
		html += '</td>'

		html += '</tr>'
		return html
	}

}

function qroupIssues(issues, epics) {
	return issues.reduce(function (result, issue) {
    	var epicKey = ""
    	if (issue.epic != null) {
    		epicKey = issue.epic.key
    		epics[epicKey] = epics[epicKey] || issue.epic
    	}
    	result[epicKey] = result[epicKey] || [];
        result[epicKey].push(issue);
    	return result;
    }, Object.create(null))
}

var Issues = {

	filter: function(issues) {
		return issues.filter(issue => issue.type != "Epic")
	},

	draw: function(issues) {
		var epics = []
		var developmentCount = issues.filter(issue => issue.development != null).length
		var qaCount = issues.filter(issue => issue.qa != null).length
		var testCassesCount = issues.filter(issue => issue.testCasses != null).length

		var columnCount = 3
		if (developmentCount > 0) {
			columnCount++
		}
		if (qaCount > 0) {
			columnCount++
		}
		if (testCassesCount > 0) {
			columnCount++
		}

	    var groupedIssues = qroupIssues(issues, epics)

		function row(issue) {
			var html = '<tr>'

			html += '<th scope="row">' + issue.type + '</td>'
			var name = issue.name
			if(issue.isEasy) {
				name += " ❤️"
			}
			html += Table.column(Table.link(Table.strikeResolved(name, issue), issue.uri, issue.platform))
			if (developmentCount > 0) {
				if (issue.development != null) {
					html += Table.task(issue.development)
				} else {
					html += Table.column("")
				}
			}
			if (qaCount > 0) {
				if (issue.qa != null) {
					html += Table.task(issue.qa)
				} else {
					html += Table.column("")
				}
			}
			if (testCassesCount > 0) {
				if (issue.testCasses != null) {
					html += Table.task(issue.testCasses)
				} else {
					html += Table.column("")
				}
			}
			var storyPoints =  Table.warning()
			if (issue.storyPoints != null) {
				storyPoints = issue.storyPoints
			}
			html += Table.column(storyPoints)

			html += '</tr>'
			return html
		}

		function section(epic, issues = []) {
			var html = ''
			if (epic != null) {
				html += Table.rowEpic(epic, columnCount)
			}
			html += '<tr>'
			html += issues.reduce(function(result, issue) { 
				return result + row(issue) 
			}, "")
			html += '</tr>'
			return html
		}


		var html = '<table class="table table-bordered">'

		html += '<thead>'
		html += '<tr>'
		html += '<th>Тип задачи</th>'
		html += '<th>Название</th>'
		if (developmentCount > 0) {
			html += '<th>Development</th>'
		}
		if (qaCount > 0) {
			html += '<th>QA</th>'
		}
		if (testCassesCount > 0) {
			html += '<th>Test Cases</th>'
		}
		html += '<th>Story Points</th>'
		html += '</tr>'
		html += '</thead>'

		html += '<tbody>'
		html += section(null, groupedIssues[""])
		for (var key in epics) {
		    var epic = epics[key];
			html += section(epic, groupedIssues[key])
		}
		html += '</tbody>'

		html += '</table>'
		document.write(html)
	},

}
