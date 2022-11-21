$(document).ready(function () {
	const editor = ace.edit('editor');

	const MAX_ITERATIONS = 10000;

	let initialState;
	let machine;
	let inputString;
	let processedMachine;
	let processedMachineLineNumbers;
	let processedInputString;

	/* Each element is of the form:
	   [state, direction, stimulus, next state, decision] */
	let parsedMachine;
	let adjGraphDirection;
	let adjGraphNextState;

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
		initialState = '';
		machine = '';
		inputString = '';
		processedMachine = [];
		processedMachineLineNumbers = [];
		processedInputString = '';

		parsedMachine = [];
		adjGraphDirection = {};
		adjGraphNextState = {};

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

		initialState = processedMachine[0].trim();
		processedMachine.shift();
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
		let tokensRaw = line.split(' ');
		let tokens = [];

		for (const token of tokensRaw) {
			if (token.trim().length != 0) {
				tokens.push(token);
			}
		}

		if (tokens.length < 3) {
			alert(`Line ${lineNumber + 1}: Incomplete information about transition or accepting/rejecting state. Expected at least 3 whitespace-separated tokens, but found only ${tokens.length}`);
			return false;
		}

		let state = tokens[0].trim();
		let separatorBracket = tokens[1];

		if (separatorBracket.trim() !== ']') {
			alert(`Line ${lineNumber + 1}: Expected ' ] ' after state name '${state}', but found '${separatorBracket}'.`);
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
				alert(`Line ${lineNumber + 1}: Unknown direction. Expected 'R' or 'L', but found '${directionStimulus[0].trim()}'.`);
				return false;
			}

			let separatorParen = directionStimulus[1];
			if (separatorParen !== '(') {
				let found = ' ';
				if (typeof separatorParen != 'undefined') {
					found = separatorParen;
				}

				alert(`Line ${lineNumber + 1}: Expected '(' immediately after direction '${directionRaw.trim()}', but found '${found}'.`);
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
					alert(`Line ${lineNumber + 1}: Expected single-symbol stimulus, but found stimulus starting with a whitespace followed by another symbol. A whitespace is recognized as a valid stimulus.`);
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
					alert(`Line ${lineNumber + 1}: Invalid transition. Expected only 5 whitespace-separated tokens, but found ${tokens.length}.`);
					return false;
				}
			} else {
				stimulus = directionStimulus[2];
				let separatorComma1 = directionStimulus[3];

				let nextStateParen = tokens[3];
				nextState = nextStateParen.slice(0, nextStateParen.length - 1).trim();

				if (directionStimulus.length > 4) {
					alert(`Line ${lineNumber + 1}: Expected single-symbol stimulus, but found stimulus starting with '${stimulus}${tokens[2][3]}'`);
					return false;
				}

				if (separatorComma1 !== ',') {
					alert(`Line ${lineNumber + 1}: Expected ',' immediately after stimulus, but found ' '`);
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
					alert(`Line ${lineNumber + 1}: Invalid transition. Expected only 4 whitespace-separated tokens, but found ${tokens.length}.`);
					return false;
				}
			}
		} else {
			decision = tokens[2].toLowerCase().trim();

			if (decision !== 'reject' && decision !== 'accept') {
				alert(`Line ${lineNumber + 1}: Unknown decision. Expected 'reject' or 'accept', but found '${decision}'. If you meant to enter a transition, check if there is a space between the comma and the name of the next state`);
				return false;
			}

			/* Extra token after decision results in the line being interpreted as a transition */
		}

		parsedMachine.push([String(state), String(stimulus), String(direction), String(nextState), String(decision)]);

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

	function isTransition(line) {
		return line[line.length - 1].length == 0;
	}

	function isTransitionState(state) {
		return adjGraphDirection[state] === 'accept' || adjGraphDirection[state] === 'reject';
	}

	function constructBlankAdjGraph() {
		const stateSet = getStateSet(0, 3);
		const stimulusAlphabet = getStimulusAlphabet(1);

		for (const state of stateSet) {
			adjGraphDirection[state] = {};
			adjGraphNextState[state] = {};

			for (const stimulus of stimulusAlphabet) {
				adjGraphDirection[state][stimulus] = '';
				adjGraphNextState[state][stimulus] = [];
			}
		}
	}

	function getStateSet(stateIdx, nextStateIdx) {
		const stateSet = new Set();
		for (const line of parsedMachine) {
			if (line[stateIdx].length > 0) {
				stateSet.add(line[stateIdx]);
			}

			if (line[nextStateIdx].length > 0) {
				stateSet.add(line[nextStateIdx]);
			}
		}

		return stateSet;
	}

	function getStimulusAlphabet(stimulusIdx) {
		const stimulusAlphabet = new Set();
		for (const line of parsedMachine) {
			if (line[stimulusIdx].length > 0) {
				stimulusAlphabet.add(line[stimulusIdx]);
			}
		}

		return stimulusAlphabet;
	}

	function convertToAdjGraph() {
		for (const line of parsedMachine) {
			let state = line[0];
			let stimulus = line[1];
			let direction = line[2];
			let nextState = line[3];
			let decision = line[4];

			if (isTransition(line)) {
				adjGraphDirection[state][stimulus] = direction;
				adjGraphNextState[state][stimulus].push(nextState);
			} else {
				adjGraphDirection[state] = decision;
			}
		}

		console.log(adjGraphDirection);
		console.log(adjGraphNextState);
	}

	function convertMachineToJS() {
		const canParse = parseMachine();

		if (!canParse) {
			return false;
		}

		constructBlankAdjGraph();
		convertToAdjGraph();

		return true;
	}
});
