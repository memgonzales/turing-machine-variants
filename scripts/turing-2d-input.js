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
			'** INITIAL STATE **',
			'The first line should be a single string denoting the initial state. It can be any string, provided that it does not contain any whitespace.',
			'',
			'** TRANSITIONS **',
			'Each transition should be entered on a separate line following this format:',
			'',
			'<state> ] <direction>(<input-symbol>, <next-symbol>, <next-state>)',
			'Important: The whitespaces matter since the parser performs whitespace-based tokenization.',
			'',
			'state, next-state',
			'  - Can be any string not containing whitespace',
			'  - Should not start with ; (otherwise, the line will be interpreted as a comment)',
			'direction',
			'  - R: Move the tape head to the right',
			'  - L: Move the tape head to the left',
			'input-symbol, next-symbol',
			'  - Can be any character except whitespace',
			'  - # is used to demarcate input strings',
			'',
			'** HALTING STATES **',
			'Halting states should be indicated following this format:',
			'',
			'<state> ] <decision>',
			'Important: The whitespaces matter since the parser performs whitespace-based tokenization.',
			'',
			'state',
			'  - Can be any string not containing whitespace',
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

	function displayTestCase(value) {
		const lines = {
			'axbxcx-non': [
				'R1',
				'',
				'R1 ] R(a, 1, R2)',
				'R2 ] R(a, a, R2)',
				'R2 ] R(1, 1, D1-R2Y1)',
				'; skip Y',
				'D1-R2Y1 ] D(1, 1, D2-R2Y1)',
				'D2-R2Y1 ] D(#, #, U1-R2Y1)',
				'U1-R2Y1 ] U(1, 1, U2-R2Y1)',
				'U2-R2Y1 ] U(1, 1, R2)',
				'',
				'R2 ] R(b, 1, D1-R2Y2)',
				'; write Y',
				'D1-R2Y2 ] D(#, 1, U1-R2Y2)',
				'U1-R2Y2 ] U(1, 1, R3)',
				'',
				'R3 ] R(b, b, R3)',
				'R3 ] R(1, 1, D1-R3Z1)',
				'; skip Z',
				'D1-R3Z1 ] D(1, 1, D2-R3Z1)',
				'D2-R3Z1 ] D(1, 1, D3-R3Z1)',
				'D3-R3Z1 ] D(#, #, U1-R3Z1)',
				'U1-R3Z1 ] U(1, 1, U2-R3Z1)',
				'U2-R3Z1 ] U(1, 1, U3-R3Z1)',
				'U3-R3Z1 ] U(1, 1, R3)',
				'',
				'R3 ] R(c, 1, D1-R3Z2)',
				'; write Z',
				'D1-R3Z2 ] D(#, 1, D2-R3Z2)',
				'D2-R3Z2 ] D(#, 1, U1-R3Z2)',
				'U1-R3Z2 ] U(1, 1, U2-R3Z2)',
				'U2-R3Z2 ] U(1, 1, L1)',
				'',
				'L1 ] L(a, a, L1)',
				'L1 ] L(b, b, L1)',
				'L1 ] L(1, 1, D1-L1Y1)',
				'; skip Y',
				'D1-L1Y1 ] D(1, 1, D2-L1Y1)',
				'D2-L1Y1 ] D(#, #, U1-L1Y1)',
				'U1-L1Y1 ] U(1, 1, U2-L1Y1)',
				'U2-L1Y1 ] U(1, 1, L1)',
				'; skip Z',
				'D2-L1Y1 ] D(1, 1, D1-L1Z1)',
				'D1-L1Z1 ] D(#, #, U1-L1Z1)',
				'U1-L1Z1 ] U(1, 1, U1-L1Y1)',
				'; hit X',
				'D1-L1Y1 ] D(#, #, U1)',
				'U1 ] U(1, 1, R1)',
				'',
				'; evaluate',
				'R1 ] R(#, #, accept)',
				'R1 ] R(b, b, reject)',
				'R1 ] R(c, c, reject)',
				'R1 ] R(1, 1, D1-R1Y1)',
				'; hit Y',
				'D1-R1Y1 ] D(1, 1, D2-R1Y1)',
				'D2-R1Y1 ] D(#, #, U1-R1Y1)',
				'U1-R1Y1 ] U(1, 1, U2-R1Y1)',
				'U2-R1Y1 ] U(1, 1, R-last)',
				'',
				'R-last ] R(#, #, accept)',
				'R-last ] R(a, a, reject)',
				'R-last ] R(b, b, reject)',
				'R-last ] R(c, c, reject)',
				'R-last ] R(1, 1, D1-RlastY1)',
				'; skip Y',
				'D1-RlastY1 ] D(1, 1, D2-RlastY1)',
				'D2-RlastY1 ] D(#, #, U1-RlastY1)',
				'U1-RlastY1 ] U(1, 1, U2-RlastY1)',
				'U2-RlastY1 ] U(1, 1, R-last)',
				'; skip Z',
				'D2-RlastY1 ] D(1, 1, D1-RlastZ1)',
				'D1-RlastZ1 ] D(#, #, U1-RlastZ1)',
				'U1-RlastZ1 ] U(1, 1, U1-RlastY1)',
				'',
				'; reject',
				'R2 ] R(c, c, reject)',
				'R2 ] R(#, #, reject)',
				'; hit Z',
				'R2 ] R(1, 1, D1-R2Y3)',
				'D1-R2Y3 ] D(1, 1, D2-R2Y3)',
				'D2-R2Y3 ] D(1, 1, reject)',
				'',
				'R3 ] R(a, a, reject)',
				'R3 ] R(#, #, reject)',
				'',
				'; halt',
				'accept ] accept',
				'reject ] reject'
			]
		};

		return lines[value];
	}
});
