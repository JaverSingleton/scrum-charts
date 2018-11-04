var Issues =  {

	draw: function(issues) {

		function column(text) {
			var html = '<td>'

			html += text

			html += '</td>'
			return html
		}

		function row(issue) {
			var html = '<tr>'

			html += column(issue.key)
			html += column(issue.name)
			if (issue.qa != null) {
				if (issue.qa.outSprint) {
					html += column("НЕ В СПРИНТЕ!")
				} else {
					html += column(issue.qa.assignee)
				}
			} else {
				html += column("")
			}
			if (issue.testCasses != null) {
				if (issue.testCasses.outSprint) {
					html += column("НЕ В СПРИНТЕ!")
				} else {
					html += column(issue.testCasses.assignee)
				}
			} else {
				html += column("")
			}
			html += column(issue.storyPoints)

			html += '</tr>'
			return html
		}

		var html = '<table width="100%" class="layout">'
		html += '<tr>'
		html += '<th>Номер</th>'
		html += '<th>Название</th>'
		html += '<th>QA</th>'
		html += '<th>Test Casses</th>'
		html += '<th>Story Points</th>'
		html += '</tr>'

		html += issues.reduce (function(result, issue){ return result + row(issue) }, "")

		html += '</table>'
		document.write(html)
	}
}
