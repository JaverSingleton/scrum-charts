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

			html += '<th scope="row">' + issue.key + '</td>'
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

		var html = '<table class="table table-bordered">'

		html += '<thead>'
		html += '<tr>'
		html += '<th>Номер задачи</th>'
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
