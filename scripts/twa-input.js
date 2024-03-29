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
			'The first line should be a single string denoting the initial state. It can be any string, provided that it does not have any whitespace.',
			'',
			'** TRANSITIONS **',
			'Each transition should be entered on a separate line following this format:',
			'',
			'<state> ] <direction>(<input-symbol>, <next-state>)',
			'Important: The whitespaces matter since the parser performs whitespace-based tokenization.',
			'',
			'state, next-state',
			'  - Can be any string not containing whitespace',
			'  - Should not start with ; (otherwise, the line will be interpreted as a comment)',
			'direction',
			'  - R: Move the tape head to the right',
			'  - L: Move the tape head to the left',
			'input-symbol',
			'  - Can be any character except whitespace',
			'  - # is used to demarcate input strings',
			'',
			'** ACCEPTING & REJECTING STATES **',
			'Accepting and rejecting states should be indicated following this format:',
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
			'odd-and-even': ['1', '', '; Even 0s', '1 ] R(1, 1)', '1 ] R(0, 2)', '1 ] R(#, 5)', '', '; Odd 0s', '2 ] R(1, 2)', '2 ] R(0, 1)', '2 ] R(#, 3)', '', '; Even 1s', '3 ] L(0, 3)', '3 ] L(1, 4)', '3 ] L(#, 6)', '', '; Odd 1s', '4 ] L(0, 4)', '4 ] L(1, 3)', '4 ] L(#, 5)', '', '5 ] reject', '6 ] accept'],
			'odd-or-even': ['even-0', '', 'even-0 ] R(0, odd-0)', 'even-0 ] R(1, even-0)', 'odd-0 ] R(0, even-0)', 'odd-0 ] R(1, odd-0)', '', 'odd-0 ] R(#, accept)', 'even-0 ] R(#, even-1)', '', 'even-1 ] L(1, odd-1)', 'even-1 ] L(0, even-1)', 'odd-1 ] L(1, even-1)', 'odd-1 ] L(0, odd-1)', '', 'even-1 ] L(#, accept)', 'odd-1 ] L(#, reject)', '', 'reject ] reject', 'accept ] accept'],
			'sad-and-smiley': [
				'r1',
				'',
				'; 1',
				'r1 ] R(0, r2)',
				'r1 ] R(1, r1)',
				'r1 ] R(#, reject-r)',
				'',
				'; 2',
				'r2 ] R(0, r3)',
				'r2 ] R(1, r2)',
				'r2 ] R(#, reject-r)',
				'',
				'; 3',
				'r3 ] R(0, r4)',
				'r3 ] R(1, r3)',
				'r3 ] R(#, reject-r)',
				'',
				'; k',
				'r4 ] R(0, r5)',
				'r4 ] R(1, r4)',
				'r4 ] R(#, l1)',
				'',
				'; 2k',
				'r5 ] R(0, r6)',
				'r5 ] R(1, r5)',
				'r5 ] R(#, reject-r)',
				'',
				'; 3k',
				'r6 ] R(0, r4)',
				'r6 ] R(1, r6)',
				'r6 ] R(#, reject-r)',
				'',
				'; 1',
				'l1 ] L(1, l2)',
				'l1 ] L(0, l1)',
				'l1 ] L(#, reject-l)',
				'',
				'; 2',
				'l2 ] L(1, l3)',
				'l2 ] L(0, l2)',
				'l2 ] L(#, reject-l)',
				'',
				'; i',
				'l3 ] L(1, l4)',
				'l3 ] L(0, l3)',
				'l3 ] L(#, accept)',
				'',
				'; 2i',
				'l4 ] L(1, l3)',
				'l4 ] L(0, l4)',
				'l4 ] L(#, reject-l)',
				'',
				'reject-r ] reject',
				'reject-l ] reject',
				'accept ] accept'
			],
			'a-preceded-b': ['1', '', '1 ] R(@, 2)', '2 ] L(@, reject)', '2 ] L(#, reject)', '2 ] L(!, 3)', '3 ] R(@, 1)', '', '1 ] R(!, 1)', '1 ] R(#, accept)', '', 'accept ] accept', 'reject ] reject'],
			'codon-det': [
				'a',
				'',
				'a ] R(A, b)',
				'a ] R(U, hell)',
				'a ] R(C, hell)',
				'a ] R(G, hell)',
				'a ] R(#, hell)',
				'',
				'b ] R(U, c)',
				'b ] R(A, hell)',
				'b ] R(C, hell)',
				'b ] R(G, hell)',
				'b ] R(#, hell)',
				'',
				'c ] R(G, d)',
				'c ] R(A, hell)',
				'c ] R(U, hell)',
				'c ] R(C, hell)',
				'c ] R(#, hell)',
				'',
				'd ] R(A, d)',
				'd ] R(U, d)',
				'd ] R(C, d)',
				'd ] R(G, d)',
				'd ] R(#, f)',
				'',
				'f ] L(A, g)',
				'f ] L(G, i)',
				'f ] L(U, hell)',
				'f ] L(C, hell)',
				'f ] L(#, hell)',
				'',
				'g ] L(A, h)',
				'g ] L(G, h)',
				'g ] L(U, hell)',
				'g ] L(C, hell)',
				'g ] L(#, hell)',
				'',
				'h ] L(U, accept)',
				'h ] L(A, hell)',
				'h ] L(C, hell)',
				'h ] L(G, hell)',
				'h ] L(#, hell)',
				'',
				'i ] L(A, j)',
				'i ] L(U, hell)',
				'i ] L(C, hell)',
				'i ] L(G, hell)',
				'i ] L(#, hell)',
				'',
				'j ] L(U, accept)',
				'j ] L(A, hell)',
				'j ] L(C, hell)',
				'j ] L(G, hell)',
				'j ] L(#, hell)',
				'',
				'hell ] reject',
				'accept ] accept',
				''
			],
			'a-before-b': ['1', '', "; Handle a's", '1 ] R(a, 1)', '1 ] R(b, 2)', '1 ] R(#, 3)', '', "; Handle b's", '2 ] R(a, 4)', '2 ] R(b, 2)', '2 ] R(#, 3)', '', '3 ] accept', '4 ] reject'],
			'power-mod3': ['rem-1', '', 'rem-1 ] R(1, rem-2)', 'rem-1 ] R(0, rem-1)', 'rem-1 ] R(#, rej)', '', 'rem-2 ] R(1, rem-2)', 'rem-2 ] R(0, rem-1)', 'rem-2 ] R(#, acc)', '', 'rej ] reject', 'acc ] accept'],
			'1-mod3': ['rem-0', '', 'rem-0 ] R(0, rem-0)', 'rem-0 ] R(1, rem-1)', 'rem-0 ] R(#, hell)', '', 'rem-1 ] R(0, rem-2)', 'rem-1 ] R(1, rem-0)', 'rem-1 ] R(#, heaven)', '', 'rem-2 ] R(1, rem-2)', 'rem-2 ] R(0, rem-1)', 'rem-2 ] R(#, hell)', '', '', 'hell ] reject', 'heaven ] accept'],
			'010-or-11': ['A', '', 'A ] R(0, A)', 'A ] R(1, A)', 'A ] R(#, Y)', 'Y ] reject', '', '; Handle 010', 'A ] R(0, B)', 'B ] R(1, C)', 'C ] R(0, D)', '', '; Handle 11', 'A ] R(1, E)', 'E ] R(1, D)', '', 'D ] R(0, D)', 'D ] R(1, D)', 'D ] R(#, X)', '', 'X ] accept'],
			'at-exclaim': ['start', '', 'start ] R(@, hell)', 'start ] R(!, hell)', 'start ] R(#, hell)', '', 'start ] R(@, next1)', 'next1 ] R(!, accept)', 'next1 ] R(@, next1)', 'next1 ] R(#, hell)', '', 'start ] R(!, next2)', 'next2 ] R(@, accept)', 'next2 ] R(!, next2)', 'next2 ] R(#, hell)', '', 'hell ] reject', 'accept ] accept'],
			'error-syntax': [
				'even-0',
				'',
				'; Expected: even-0 ] R(0, odd-0)',
				'; Actual:   even-0 | R(0, odd-0)',
				'even-0 | R(0, odd-0)',
				'',
				'; Expected: even-0 ] R(1, even-0)',
				'; Actual:   even-0 ] R (1, even-0)',
				'even-0 ] R (1, even-0)',
				'',
				'; Expected: odd-0 ] R(0, even-0)',
				'; Actual:   odd-0 ] R(0, even-0x',
				'odd-0 ] R(0, even-0x',
				'',
				'; Expected: odd-0 ] R(1, odd-0)',
				'; Actual:   odd-0 ] R(1,',
				'odd-0 ] R(1,',
				'',
				'; Expected: odd-0 ] R(#, accept)',
				'; Actual:   odd-0 ] R(# , accept)',
				'odd-0 ] R(# , accept)',
				'',
				'even-0 ] R(#, even-1)',
				'',
				'even-1 ] L(1, odd-1)',
				'even-1 ] L(0, even-1)',
				'odd-1 ] L(1, even-1)',
				'odd-1 ] L(0, odd-1)',
				'',
				'even-1 ] L(#, accept)',
				'odd-1 ] L(#, reject)',
				'',
				'reject ] reject',
				'accept ] accept'
			],
			'error-direction': ['even-0', '', 'even-0 ] X(0, accept)', 'accept ] accept'],
			'error-decision': ['even-0', '', 'even-0 ] R(0, accept)', 'accept ] what'],
			'error-multiple': ['even-0', '', 'even-0 ] R(01, accept)', 'accept ] what'],
			'error-no-stimulus': ['even-0', '', 'even-0 ] R(, accept)', 'accept ] accept'],
			'error-invalid': ['even-0', '', 'even-0 ] L(#, accept)', 'accept ] accept'],
			'error-tokens': ['even-0', '', 'even-0 ] L(#, accept) extra-token-here', 'accept ] accept'],
			'error-unique': ['even-0', '', 'even-0 ] R(0, accept)', 'even-0 ] L(0, accept)', 'accept ] accept'],
			'error-loop': ['even-0', '', 'even-0 ] R(0, even-1)', 'even-0 ] R(#, even-1)', 'even-0 ] R(1, even-1)', '', 'even-1 ] L(#, even-0)', 'accept ] accept']
		};

		return lines[value];
	}
});
