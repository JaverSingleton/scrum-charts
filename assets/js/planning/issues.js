var Table = {

	strikeResolved: function(text, issue) {
		if (issue.isResolved) {
			return '<s>' + text + '</s>'
		} else {
			return text
		}
	},

	link: function(text, uri) {
		return '<a href="' + uri + '" target="_blank">' + text + '</a>'
	},

	assignee: function(issue) {
		var text = ""
		if (issue.outSprint) {
			text += "НЕ В СПРИНТЕ!"
		} else {
			text += issue.assignee
		}
		text = this.strikeResolved(text, issue)
		return this.column(this.link(text, issue.uri))
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
			name = issue.key + " - НЕ В СПРИНТЕ!"
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

	developmentOnly: function(issues) {
		return issues.filter(issue => issues && issue.platform != "QA" && issue.type != "Epic")
	},

	qaOnly: function(issues) {
		return issues.filter(issue => issues && issue.platform == "QA" && issue.type != "Epic")
	},

	drawDevelopment: function(issues) {
		var epics = []
	    var groupedIssues = qroupIssues(issues, epics)

		function row(issue) {
			var html = '<tr>'

			html += '<th scope="row">' + issue.type + '</td>'
			html += Table.column(Table.link(Table.strikeResolved(issue.name, issue), issue.uri))
			if (issue.qa != null) {
				html += Table.assignee(issue.qa)
			} else {
				html += Table.column("")
			}
			if (issue.testCasses != null) {
				html += Table.assignee(issue.testCasses)
			} else {
				html += Table.column("")
			}
			var storyPoints = "НЕ УКАЗАНО!"
			if (issue.storyPoints != null) {
				storyPoints = issue.storyPoints
			}
			html += Table.column(storyPoints)

			html += '</tr>'
			return html
		}

		function section(epic, issues) {
			var html = ''
			if (epic != null) {
				html += Table.rowEpic(epic, 5)
			}
			html += '<tr>'
			html += issues.reduce(function(result, issue) { 
				if (issue.platform != "QA") {
					return result + row(issue) 
				} else {
					return result
				}
			}, "")
			html += '</tr>'
			return html
		}


		var html = '<table class="table table-bordered">'

		html += '<thead>'
		html += '<tr>'
		html += '<th>Тип задачи</th>'
		html += '<th>Название</th>'
		html += '<th>QA</th>'
		html += '<th>Test Cases</th>'
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

	drawTesting: function(issues) {
		var epics = []
	    var groupedIssues = qroupIssues(issues, epics)

		function row(issue) {
			var html = '<tr>'

			html += '<th scope="row">' + issue.type + '</td>'
			html += Table.column(Table.link(Table.strikeResolved(issue.name, issue), issue.uri))
			if (issue.development != null) {
				html += Table.assignee(issue.development)
			} else {
				html += Table.column("")
			}
			var storyPoints = "НЕ УКАЗАНО!"
			if (issue.storyPoints != null) {
				storyPoints = issue.storyPoints
			}
			html += Table.column(storyPoints)

			html += '</tr>'
			return html
		}

		function section(epic, issues) {
			var html = ''
			if (epic != null) {
				html += Table.rowEpic(epic, 4)
			}
			html += '<tr>'
			html += issues.reduce (function(result, issue){ 
				if (issue.platform == "QA") {
					return result + row(issue) 
				} else {
					return result
				}
			}, "")
			html += '</tr>'
			return html
		}


		var html = '<table class="table table-bordered">'

		html += '<thead>'
		html += '<tr>'
		html += '<th>Тип задачи</th>'
		html += '<th>Название</th>'
		html += '<th>Developer</th>'
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
	}

}
