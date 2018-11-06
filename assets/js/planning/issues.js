var Issues =  {

	draw: function(issues) {

		function strikeResolved(text, issue) {
			if (issue.isResolved) {
				return '<s>' + text + '</s>'
			} else {
				return text
			}
		}

		function link(text, uri) {
			return '<a href="' + uri + '">' + text + '</a>'
		}

		function assignee(issue) {
			var text = ""
			if (issue.outSprint) {
				text += "НЕ В СПРИНТЕ!"
			} else {
				text += issue.assignee
			}
			text = strikeResolved(text, issue)
			return column(link(text, issue.uri))
		}

		function column(text) {
			var html = '<td>'

			html += text

			html += '</td>'
			return html
		}

		function row(issue) {
			var html = '<tr>'

			html += '<th scope="row">' + issue.type + '</td>'
			html += column(link(strikeResolved(issue.name, issue), issue.uri))
			if (issue.qa != null) {
				html += assignee(issue.qa)
			} else {
				html += column("")
			}
			if (issue.testCasses != null) {
				html += assignee(issue.testCasses)
			} else {
				html += column("")
			}
			html += column(issue.storyPoints)

			html += '</tr>'
			return html
		}

		var html = '<table class="table table-bordered">'

		html += '<thead>'
		html += '<tr>'
		html += '<th>Тип задачи</th>'
		html += '<th>Название</th>'
		html += '<th>QA</th>'
		html += '<th>Test Casses</th>'
		html += '<th>Story Points</th>'
		html += '</tr>'
		html += '</thead>'

		html += '<tbody>'
		html += issues.reduce (function(result, issue){ return result + row(issue) }, "")
		html += '</tbody>'

		html += '</table>'
		document.write(html)
	}
}
