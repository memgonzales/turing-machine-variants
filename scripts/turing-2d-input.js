$(document).ready(function () {
	const editor = ace.edit('editor');

	let previous = 'instructions';
	let previousText = '';

	const START = { row: 0, column: 0 };

	instructions();

	$('#test-cases')
		.on('focus', function () {
			previous = this.value;
		})
		.change(function (e) {
			if (hasEditorChanges(previousText) && previous != 'instructions') {
				if (confirm('Are you sure you want to discard the current machine?')) {
					switchMachine(e);
				} else {
					$('#test-cases').val(previous);
					previous = this.value;
				}
			} else {
				switchMachine(e);
			}

			$(this).blur();
		});

	function switchMachine(e) {
		resetEditor();

		switch ($(e.currentTarget).val()) {
			case 'instructions':
				instructions();
				break;
		}
	}

	function updateEditor(lines) {
		previousText = lines.join('\n');
		editor.session.insert(START, previousText);
	}

	function instructions() {
		const lines = [
			'** INITIAL STATE **',
			'The first line should be a single string denoting the initial state. It can be any string, provided that it does not contain any whitespace.',
			'',
			'** TRANSITIONS **',
			'Each transition should be entered on a separate line following this format:',
			'',
			'<state> ] <direction>(<stimulus>/<new-symbol>, <next-state>)',
			'Important: The whitespaces matter.',
			'',
			'state, next-state',
			'  - Can be any string, provided that it does not contain any whitespace',
			'  - Should not start with ; (otherwise, the line will be interpreted as a comment)',
			'direction, new-symbol',
			'  - R: Move the tape head to the right',
			'  - L: Move the tape head to the left',
			'stimulus',
			'  - Can be any character',
			'  - # is used to demarcate input strings',
			'',
			'** HALTING STATES **',
			'Halting states should be indicated following this format:',
			'',
			'<state> ] <decision>',
			'Important: The whitespaces matter.',
			'',
			'state, next-state',
			'  - Can be any string, provided that it does not contain any whitespace',
			'  - Should not start with ; (otherwise, the line will be interpreted as a comment)',
			'decision',
			'  - "accept" or "reject" (without quotes)',
			'',
			'** COMMENTS **',
			'Lines that begin with a semicolon (;) are treated as comments and are, thus, ignored during parsing.',
			''
		];
		updateEditor(lines);

		let marker1Lines = [0, 3, 19, 31];
		let marker2Lines = [6, 22];

		for (const line of marker1Lines) {
			editor.session.addMarker(new Range(line, 0, line, 1), 'marker1', 'fullLine');
		}

		for (const line of marker2Lines) {
			editor.session.addMarker(new Range(line, 0, line, 1), 'marker2', 'fullLine');
		}

		editor.setReadOnly(true);
		$('#run').prop('disabled', true);
		$('#input-string').prop('readonly', true);
	}
});
