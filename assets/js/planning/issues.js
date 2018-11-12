var Table = {

	strikeResolved: function(text, issue) {
		if (issue.isResolved) {
			return '<s>' + text + '</s>'
		} else {
			return text
		}
	},

	link: function(text, uri) {
		return '<a href="' + uri + '">' + text + '</a>'
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
	} 

}

var Issues = {

	developmentOnly: function(issues) {
		return issues.filter(issue => issues && issue.type != "QA")
	},

	qaOnly: function(issues) {
		return issues.filter(issue => issues && issue.type == "QA")
	},

	drawDevelopment: function(issues) {

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
		html += issues.reduce (function(result, issue){ 
			if (issue.type != "QA") {
				return result + row(issue) 
			} else {
				return result
			}
		}, "")
		html += '</tbody>'

		html += '</table>'
		document.write(html)
	},

	drawTesting: function(issues) {

		function row(issue) {
			var html = '<tr>'

			html += '<th scope="row">' + issue.platform + '</td>'
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
		html += issues.reduce (function(result, issue){ 
			if (issue.type == "QA") {
				return result + row(issue) 
			} else {
				return result
			}
		}, "")
		html += '</tbody>'

		html += '</table>'
		document.write(html)
	}

}
