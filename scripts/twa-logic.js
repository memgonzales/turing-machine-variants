$(document).ready(function () {
	const editor = ace.edit('editor');

	const MAX_ITERATIONS = 10000;

	let machine;
	let inputString;
	let processedMachine;
	let processedMachineLineNumbers;
	let processedInputString;

	let numColumns;
	let numRows;

	editor.on('input', function () {
		if (getCurrentText().trim() == 0) {
			$('#run').prop('disabled', true);
		} else if ($('#test-cases').val() !== 'instructions') {
			$('#run').prop('disabled', false);
		}
	});

	$('#run').on('click', function () {
		resetInputAttributes();
		getInput();
		processInput();

		if (convertMachineToJS()) {
			prepareTape();
			appendTape();
		} else {
			removeTape();
		}
	});

	function resetInputAttributes() {
		machine = '';
		inputString = '';
		processedMachine = [];
		processedMachineLineNumbers = [];
		processedInputString = '';

		numColumns = 0;
		numRows = 1;
	}

	function getInput() {
		machine = getCurrentText();
		inputString = $('#input-string').val();
	}

	function processMachine() {
		let lineNumber = 0;

		const machineLines = machine.split('\n');

		for (const line of machineLines) {
			const lineTrimmed = line.trim();
			if (lineTrimmed[0] != ';' && lineTrimmed.length > 0) {
				processedMachine.push(line);
				processedMachineLineNumbers.push(lineNumber);
			}

			lineNumber++;
		}
	}

	function processInputString() {
		processedInputString = `#${inputString}#`;
	}

	function processInput() {
		processMachine();
		processInputString();
	}

	function prepareTape() {
		/* +2 for the initial and terminal # */
		numColumns = inputString.length + 2;
	}

	function createTable() {
		let table = '';
		for (let i = 0; i < numRows; i++) {
			let row = '';
			for (let j = 0; j < numColumns; j++) {
				row += `<td id = "${i}-${j}" class = "text-center">${processedInputString[j]}</td>`;
			}
			row = `<tr>${row}</tr>`;
			table += row;
		}

		table = `<table id = "tape" class = "table table-bordered">${table}</table>`;

		return table;
	}

	function removeTape() {
		$('#break-tape').remove();
		$('#tape').remove();
	}

	function appendTape() {
		removeTape();
		$('#simulation').append('<br id = "break-tape">' + createTable());
		$('#0-0').attr('style', 'background-color: rgb(47, 47, 105); color: white');
	}

	function parseLine(line, lineNumber) {
		let tokensOrig = line.split(' ');
		let tokens = [];

		for (const token of tokensOrig) {
			if (token.trim().length != 0) {
				tokens.push(token);
			}
		}

		if (tokens.length < 3) {
			alert(`Line ${lineNumber + 1}: Incomplete information about transition or accepting/rejecting state.`);
			return false;
		}

		let state = tokens[0].trim();

		if (tokens[1].trim() !== ']') {
			alert(`Line ${lineNumber + 1}: Expected ' ]' immediately after state name.`);
			return false;
		}

		let direction = '';
		let stimulus = '';
		let nextState = '';
		let decision = '';

		if (tokens.length > 3) {
			direction = tokens[2][0].toUpperCase().trim();

			if (direction !== 'R' && direction !== 'L') {
				alert(`Line ${lineNumber + 1}: Unknown direction (expected 'R' or 'L').`);
				return false;
			}

			if (tokens[2][1] !== '(') {
				alert(`Line ${lineNumber + 1}: Expected '(' immediately after direction.`);
				return false;
			}

			/* The stimulus is a whitespace. */
			if (tokens[2].length < 3) {
				stimulus = ' ';
				nextState = tokens[4].slice(0, tokens[4].length - 1).trim();

				/* Stimulus consists of more than one whitespace. */
				if (tokens[3].length === 0 || tokens[3] !== ',') {
					alert(`Line ${lineNumber + 1}: Expected single-character stimulus.`);
					return false;
				}

				if (tokens[4][tokens[4].length - 1] !== ')') {
					alert(`Line ${lineNumber + 1}: Expected ')' immediately after name of next state.`);
					return false;
				}

				if (nextState.length == 0) {
					alert(`Line ${lineNumber + 1}: Expected name of next state.`);
					return false;
				}
			} else {
				stimulus = tokens[2][2];
				nextState = tokens[3].slice(0, tokens[3].length - 1).trim();

				if (tokens[2].length > 4) {
					alert(`Line ${lineNumber + 1}: Expected single-character stimulus.`);
					return false;
				}

				if (tokens[2][3] !== ',') {
					alert(`Line ${lineNumber + 1}: Expected ',' immediately after stimulus`);
					return false;
				}

				if (tokens[3][tokens[3].length - 1] !== ')') {
					alert(`Line ${lineNumber + 1}: Expected ')' immediately after name of next state`);
					return false;
				}

				if (nextState.length == 0) {
					alert(`Line ${lineNumber + 1}: Expected name of next state.`);
					return false;
				}
			}
		} else {
			decision = tokens[2].toLowerCase().trim();

			if (decision !== 'reject' && decision !== 'accept') {
				alert(`Line ${lineNumber + 1}: Unknown decision (expected 'reject' or 'accept'). If you meant to enter a transition, check if there is a space between the comma and the name of the next state`);
				return false;
			}
		}

		alert(state + ' | ' + direction + ' | ' + stimulus + ' | ' + nextState + ' | ' + decision);

		return true;
	}

	function parseMachine() {
		for (let i = 0; i < processedMachine.length; i++) {
			if (!parseLine(processedMachine[i], processedMachineLineNumbers[i])) {
				return false;
			}
		}

		return true;
	}

	function convertMachineToJS() {
		const canParse = parseMachine();

		if (!canParse) {
			return false;
		}

		return true;
	}
});
