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
			case 'odd-and-even':
				oddAndEven();
				break;
			case 'a-before-b':
				aBeforeB();
				break;
		}
	}

	function updateEditor(lines) {
		previousText = lines.join('\n');
		editor.session.insert(START, previousText);
	}

	function instructions() {
		const lines = [
			'** TRANSITIONS **',
			'Each transition should be entered on a separate line following this format:',
			'',
			'<state> ] <direction>(<stimulus>, <next-state>)',
			'Important: The whitespaces matter.',
			'',
			'state, next-state',
			'  - Can be any string, provided that it does not contain any whitespace',
			'  - Should not start with ; (otherwise, the line will be interpreted as a comment)',
			'direction',
			'  - R: Move the tape head to the right',
			'  - L: Move the tape head to the left',
			'stimulus',
			'  - Can be any character',
			'  - # is used to demarcate input strings',
			'',
			'** ACCEPTING & REJECTING STATES **',
			'Accepting and rejecting states should be indicated following this format:',
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

		let marker1Lines = [0, 16, 28];
		let marker2Lines = [3, 19];

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

	function aBeforeB() {
		const lines = ["; Handle a's", '1 ] R(a, 1)', '1 ] R(b, 2)', '1 ] R(#, 3)', '', "; Handle b's", '2 ] R(a, 4)', '2 ] R(b, 2)', '2 ] R(#, 3)', '', '3 ] accept', '4 ] reject'];
		updateEditor(lines);
	}

	function oddAndEven() {
		const lines = ['; Even 0s', '1 ] R(1, 1)', '1 ] R(0, 2)', '1 ] R(#, 5)', '', '; Odd 0s', '2 ] R(1, 2)', '2 ] R(0, 1)', '2 ] R(#, 3)', '', '; Even 1s', '3 ] L(0, 3)', '3 ] L(1, 4)', '3 ] L(#, 6)', '', '; Odd 1s', '4 ] L(0, 4)', '4 ] L(1, 3)', '4 ] L(#, 5)', '', '5 ] reject', '6 ] accept'];
		updateEditor(lines);
	}
});
