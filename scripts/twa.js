$(document).ready(function () {
	let editor = ace.edit('editor');

	let previous;
	let previousText = '';

	const START = { row: 0, column: 0 };

	instructions();
	editor.setReadOnly(true);

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
		const selected = $(e.currentTarget).val();

		switch (selected) {
			case 'instructions':
				instructions();
				editor.setReadOnly(true);
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
			'<state> ] <action>(<stimulus>, <next-state>)',
			'',
			'state, next-state',
			'  - Can be any character except ] and ;',
			'action',
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
			'',
			'state, next-state',
			'  - Can be any character except ] and ;',
			'decision',
			'  - "accept" or "reject" (without quotes)',
			'',
			'** COMMENTS **',
			'Lines that begin with a semicolon (;) are treated as comments and are, thus, ignored during parsing.',
			''
		];
		updateEditor(lines);

		let marker1Lines = [0, 14, 24];
		let marker2Lines = [3, 17];

		for (const line of marker1Lines) {
			editor.session.addMarker(new Range(line, 0, line, 1), 'marker1', 'fullLine');
		}

		for (const line of marker2Lines) {
			editor.session.addMarker(new Range(line, 0, line, 1), 'marker2', 'fullLine');
		}
	}

	function aBeforeB() {
		const lines = ['1 ] R(a, 1)', '1 ] R(b, 2)', '1 ] R(#, 3)', '2 ] R(a, 4)', '2 ] R(b, 2)', '2 ] R(#, 3)', '3 ] accept', '4 ] reject'];
		updateEditor(lines);
	}
});
