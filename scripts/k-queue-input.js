$(document).ready(function () {
	const editor = ace.edit('editor');

	let previous = 'instructions';
	let previousText = '';

	const START = { row: 0, column: 0 };

	instructions();

	window.onbeforeunload = function () {
		if (hasEditorChanges(previousText)) {
			return '';
		}
	};

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
		let value = $(e.currentTarget).val();

		switch (value) {
			case 'instructions':
				instructions();
				break;
			default:
				updateEditor(displayTestCase(value));
				break;
		}
	}

	function updateEditor(lines) {
		previousText = lines.join('\n');
		editor.session.insert(START, previousText);
	}

	function instructions() {
		const lines = [
			'** INITIAL STATE & NUMBER OF QUEUES **',
			'The first line should be a string containing the name of the initial state and the number of queues, separated by a whitespace.',
			'',
			'The initial state can be any string, provided that it does not contain any whitespace. The number of queues should be a positive integer.',
			'',
			'** TRANSITIONS **',
			'Each transition should be entered on a separate line following this format:',
			'',
			'<state> ] <action>(<symbol>, <next-state>)',
			'Important: The whitespaces matter since the parser performs whitespace-based tokenization.',
			'',
			'state, next-state',
			'  - Can be any string not containing whitespace',
			'  - Should not start with ; (otherwise, the line will be interpreted as a comment)',
			'action',
			'  - R<k>: Dequeue the specified symbol from the kth queue (k should be a positive integer)',
			'  - W<k>: Enqueue the specified symbol to the kth queue (k should be a positive integer)',
			'  - SL: Move the input tape head to the left',
			'  - SR: Move the input tape head to the right',
			'symbol',
			'  - Can be any character except whitespace',
			'  - # is used to demarcate input strings',
			'',
			'** FINAL STATES **',
			'Final states should be indicated following this format:',
			'',
			'<state> ] final',
			'Important: The whitespaces matter since the parser performs whitespace-based tokenization.',
			'',
			'state',
			'  - Can be any string not containing whitespace',
			'  - Should not start with ; (otherwise, the line will be interpreted as a comment)',
			'',
			'** COMMENTS **',
			'Lines that begin with a semicolon (;) are treated as comments and are, thus, ignored during parsing.',
			''
		];
		updateEditor(lines);

		let marker1Lines = [0, 5, 23, 33];
		let marker2Lines = [8, 26];

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

	function displayTestCase(value) {
		const lines = {
			'axbxcx-det': ['A 3', '', 'A ] SR(a, B)', 'B ] W1(1, A)', '', 'A ] SR(b, C)', 'C ] W2(1, D)', 'D ] R1(1, E)', 'E ] SR(b, C)', '', 'E ] SR(c, F)', 'F ] W3(1, G)', 'G ] R2(1, H)', 'H ] SR(c, F)', '', 'H ] SR(#, J)', 'J ] R3(1, J)', '', 'A ] final', 'J ] final'],
			'error-direction': [],
			'error-decision': [],
			'error-multiple': [],
			'error-invalid': [],
			'error-tokens': [],
			'error-unique': []
		};

		return lines[value];
	}
});
