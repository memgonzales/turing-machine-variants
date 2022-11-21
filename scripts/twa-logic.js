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
			alert(`Line ${lineNumber + 1}: Incomplete information about transition or accepting/rejecting state. Expected at least 3 whitespace-separated tokens, but got only ${tokens.length}`);
			return false;
		}

		let state = tokens[0].trim();
		let separatorBracket = tokens[1];

		if (separatorBracket.trim() !== ']') {
			alert(`Line ${lineNumber + 1}: Expected ']' after state name '${state}', but got '${separatorBracket}'.`);
			return false;
		}

		let stimulus = '';
		let nextState = '';
		let decision = '';

		let directionStimulus = tokens[2];
		let directionRaw = directionStimulus[0];
		let direction = directionRaw.toUpperCase().trim();

		if (tokens.length > 3) {
			if (direction !== 'R' && direction !== 'L') {
				alert(`Line ${lineNumber + 1}: Unknown direction. Expected 'R' or 'L', but got '${directionStimulus[0].trim()}'.`);
				return false;
			}

			let separatorParen = directionStimulus[1];
			if (separatorParen !== '(') {
				let got = ' ';
				if (typeof separatorParen != 'undefined') {
					got = separatorParen;
				}

				alert(`Line ${lineNumber + 1}: Expected '(' immediately after direction '${directionRaw.trim()}', but got '${got}'.`);
				return false;
			}

			/* The stimulus is a whitespace. */
			if (directionStimulus.length < 3) {
				stimulus = ' ';
				let separatorComma1 = tokens[3];

				let nextStateParen = tokens[4];
				nextState = nextStateParen.slice(0, nextStateParen.length - 1).trim();

				/* Stimulus consists of more than one whitespace. */
				if (separatorComma1.length === 0 || separatorComma1 !== ',') {
					alert(`Line ${lineNumber + 1}: Expected single-symbol stimulus, but got stimulus starting with a whitespace followed by another symbol. A whitespace is recognized as a valid stimulus.`);
					return false;
				}

				if (nextStateParen[nextStateParen.length - 1] !== ')') {
					alert(`Line ${lineNumber + 1}: Expected ')' immediately after name of next state`);
					return false;
				}

				if (nextState.length == 0) {
					alert(`Line ${lineNumber + 1}: Expected name of next state.`);
					return false;
				}

				let extraToken = tokens[5];
				if (typeof extraToken !== 'undefined') {
					alert(`Line ${lineNumber + 1}: Invalid transition. Expected only 5 whitespace-separated tokens, but got ${tokens.length}.`);
					return false;
				}
			} else {
				stimulus = directionStimulus[2];
				let separatorComma1 = directionStimulus[3];

				let nextStateParen = tokens[3];
				nextState = nextStateParen.slice(0, nextStateParen.length - 1).trim();

				if (directionStimulus.length > 4) {
					alert(`Line ${lineNumber + 1}: Expected single-symbol stimulus, but got stimulus starting with '${stimulus}${tokens[2][3]}'`);
					return false;
				}

				if (separatorComma1 !== ',') {
					alert(`Line ${lineNumber + 1}: Expected ',' immediately after stimulus, but got ' '`);
					return false;
				}

				if (nextStateParen[nextStateParen.length - 1] !== ')') {
					alert(`Line ${lineNumber + 1}: Expected ')' immediately after name of next state`);
					return false;
				}

				if (nextState.length == 0) {
					alert(`Line ${lineNumber + 1}: Expected name of next state.`);
					return false;
				}

				let extraToken = tokens[4];
				if (typeof extraToken !== 'undefined') {
					alert(`Line ${lineNumber + 1}: Invalid transition. Expected only 4 whitespace-separated tokens, but got ${tokens.length}.`);
					return false;
				}
			}
		} else {
			decision = tokens[2].toLowerCase().trim();

			if (decision !== 'reject' && decision !== 'accept') {
				alert(`Line ${lineNumber + 1}: Unknown decision (expected 'reject' or 'accept'), but got '${decision}'. If you meant to enter a transition, check if there is a space between the comma and the name of the next state`);
				return false;
			}

			/* Extra token after decision results in the line being interpreted as a transition */
		}

		alert(nextState);

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
