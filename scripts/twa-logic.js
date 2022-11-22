$(document).ready(function () {
	const editor = ace.edit('editor');

	const MAX_ITERATIONS = 100;
	const NUM_CELLS = MAX_ITERATIONS;

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
	let tape;

	let config;
	let stepNumber;

	let finishedPaths;
	let finishedTapeRowIdx;
	let finishedTapeColIdx;

	let finalDecision;

	editor.on('input', function () {
		if (getCurrentText().trim() == 0) {
			$('#run').prop('disabled', true);
		} else if ($('#test-cases').val() !== 'instructions') {
			$('#run').prop('disabled', false);
		}
	});

	$('#test-cases').change(function (e) {
		resetInputAttributes();
		removeTape();
	});

	$('#run').on('click', function () {
		resetInputAttributes();
		getInput();
		processInput();

		$('#step-number').val(stepNumber);
		$('#prev').prop('disabled', true);

		if (convertMachineToJS()) {
			appendTape();
			updateTable();
			$('#step-number').prop('max', finishedPaths[config - 1].length);
		} else {
			removeTape();
		}
	});

	$('#next').on('click', function () {
		stepNumber++;
		$('#prev').prop('disabled', false);

		if (stepNumber > finishedPaths[config - 1].length) {
			stepNumber = finishedPaths[config - 1].length;
		}

		if (stepNumber == finishedPaths[config - 1].length) {
			$('#next').prop('disabled', true);
		}

		updateTable();
		$('#step-number').val(stepNumber);
	});

	$('#prev').on('click', function () {
		stepNumber--;
		$('#next').prop('disabled', false);

		if (stepNumber == 0) {
			stepNumber = 1;
		}

		if (stepNumber == 1) {
			$('#prev').prop('disabled', true);
		}

		updateTable();
		$('#step-number').val(stepNumber);
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
		numRows = 0;
		tape = [];

		config = 1;
		stepNumber = 1;

		finishedPaths = [];
		finishedTapeRowIdx = [];
		finishedTapeColIdx = [];

		finalDecision = '';

		for (let i = 0; i < NUM_CELLS; i++) {
			const tapeRow = [];
			for (let j = 0; j < NUM_CELLS; j++) {
				tapeRow.push('#');
			}

			tape.push(tapeRow);
		}
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

		/* Remove the initial state. */
		processedMachine.shift();
		processedMachineLineNumbers.shift();
	}

	function removeTape() {
		$('#break-tape').remove();
		$('#tape').remove();
		$('#simulation-controls').hide();
	}

	function appendTape() {
		removeTape();
		$('#simulation').append('<br id = "break-tape">' + createTable());
		placeInputString();
		positionTapeHead(0, 0);
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
		return adjGraphDirection[state] !== 'accept' && adjGraphDirection[state] !== 'reject';
	}

	function constructBlankAdjGraph() {
		const stateSet = getStateSet(0, 3);
		const stimulusAlphabet = getStimulusAlphabet(1);

		for (const state of stateSet) {
			adjGraphDirection[state] = '';
			adjGraphNextState[state] = {};

			for (const stimulus of stimulusAlphabet) {
				adjGraphNextState[state][stimulus] = [];
			}
		}

		/* Check the input string. */
		for (let i = 0; i < inputString.length; i++) {
			if (!stimulusAlphabet.has(inputString[i])) {
				alert(`Input string contains symbol '${inputString[i]}' at position ${i + 1}, which is not in the input alphabet.`);
				return false;
			}
		}

		/* Check the initial state. */
		if (!stateSet.has(initialState)) {
			alert(`Initial state '${initialState}' is not in the state set.`);
			return false;
		}

		return true;
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
		let idx = 0;
		for (const line of parsedMachine) {
			let state = line[0];
			let stimulus = line[1];
			let direction = line[2];
			let nextState = line[3];
			let decision = line[4];

			if (isTransition(line)) {
				if (adjGraphDirection[state].length > 0 && direction != adjGraphDirection[state]) {
					alert(`Line ${processedMachineLineNumbers[idx] + 1}: A state can be associated with exactly one direction only.`);
					return false;
				}
				adjGraphDirection[state] = direction;
				adjGraphNextState[state][stimulus].push(nextState);
			} else {
				adjGraphDirection[state] = decision;
			}

			idx++;
		}

		return true;
	}

	function storeInputStringToTape() {
		for (let i = 0; i < inputString.length; i++) {
			tape[0][i + 1] = inputString[i];
		}
	}

	function generatePaths() {
		storeInputStringToTape();

		let finishedPaths = [];
		let finishedTapeRowIdx = [];
		let finishedTapeColIdx = [];

		let unfinishedPaths = [[initialState]];
		let unfinishedTapeRowIdx = [[0]];
		let unfinishedTapeColIdx = [[0]];

		let numIterations = 1;
		while (unfinishedPaths.length != 0 && numIterations <= MAX_ITERATIONS) {
			/* Go through every unfinished path */
			let unfinishedPathsTemp = [];
			let unfinishedTapeRowIdxTemp = [];
			let unfinishedTapeColIdxTemp = [];

			for (let i = 0; i < unfinishedPaths.length; i++) {
				let isValid = true;
				let path = unfinishedPaths[i];
				let tapeRowIdx = unfinishedTapeRowIdx[i];
				let tapeColIdx = unfinishedTapeColIdx[i];

				let currentState = path[path.length - 1];
				let currentTapeRowIdx = tapeRowIdx[tapeRowIdx.length - 1];
				let currentTapeColIdx = tapeColIdx[tapeColIdx.length - 1];

				switch (adjGraphDirection[currentState]) {
					case 'R':
						currentTapeColIdx++;
						break;
					case 'L':
						currentTapeColIdx--;
						if (currentTapeColIdx == -1) {
							isValid = false;
						}
						break;
					case 'accept':
						break;
					case 'reject':
						break;
				}

				if (isValid && numIterations < MAX_ITERATIONS) {
					let stimulus = tape[currentTapeRowIdx][currentTapeColIdx];
					let nextStates = adjGraphNextState[currentState][stimulus];

					let nextPaths = [];
					let nextTapeRowIdx = [];
					let nextTapeColIdx = [];

					/* Missing transition */
					if (nextStates.length == 0) {
						finishedPaths.push(path);
						finishedTapeRowIdx.push(tapeRowIdx);
						finishedTapeColIdx.push(tapeColIdx);
					}

					for (const state of nextStates) {
						nextPaths.push(path.concat([state]));
						nextTapeRowIdx.push(tapeRowIdx.concat([currentTapeRowIdx]));
						nextTapeColIdx.push(tapeColIdx.concat([currentTapeColIdx]));
					}

					unfinishedPathsTemp = unfinishedPathsTemp.concat(nextPaths);
					unfinishedTapeRowIdxTemp = unfinishedTapeRowIdxTemp.concat(nextTapeRowIdx);
					unfinishedTapeColIdxTemp = unfinishedTapeColIdxTemp.concat(nextTapeColIdx);
				} else {
					finishedPaths.push(path);
					finishedTapeRowIdx.push(tapeRowIdx);
					finishedTapeColIdx.push(tapeColIdx);
				}
			}

			if (numIterations < MAX_ITERATIONS) {
				unfinishedPaths = unfinishedPathsTemp;
				unfinishedTapeRowIdx = unfinishedTapeRowIdxTemp;
				unfinishedTapeColIdx = unfinishedTapeColIdxTemp;
			}

			numIterations++;
		}

		if (unfinishedPaths.length != 0) {
			finishedPaths = unfinishedPaths;
			finishedTapeRowIdx = unfinishedTapeRowIdx;
			finishedTapeColIdx = unfinishedTapeColIdx;
		}

		return [finishedPaths, finishedTapeRowIdx, finishedTapeColIdx];
	}

	function convertMachineToJS() {
		const canParse = parseMachine();

		if (!canParse) {
			return false;
		}

		if (!constructBlankAdjGraph()) {
			return false;
		}

		if (!convertToAdjGraph()) {
			return false;
		}

		let generatedPaths = generatePaths();

		finishedPaths = generatedPaths[0];
		finishedTapeRowIdx = generatedPaths[1];
		finishedTapeColIdx = generatedPaths[2];

		getFinalDecision();
		setNumRowsColumns(finishedTapeRowIdx, finishedTapeColIdx);

		console.log(generatedPaths);

		return true;
	}

	function getFinalDecision() {
		let rejected = [];
		let accepted = [];
		let missingTransition = [];
		let undecided = [];

		for (let i = 0; i < finishedPaths.length; i++) {
			const path = finishedPaths[i];
			const lastState = path[path.length - 1];
			if (isTransitionState(lastState)) {
				if (path.length == MAX_ITERATIONS) {
					undecided.push(i);
				} else {
					missingTransition.push(i);
				}
			} else {
				if (adjGraphDirection[lastState] == 'accept') {
					accepted.push(i);
				} else {
					rejected.push(i);
				}
			}
		}

		if (accepted.length != 0) {
			finalDecision = 'ACCEPTED';
		} else if (rejected.length != 0) {
			finalDecision = 'REJECTED';
		} else if (missingTransition.length != 0) {
			finalDecision = 'MISSING_TRANSITION';
		} else {
			finalDecision = 'UNDECIDED';
		}
	}

	function setNumRowsColumns(finishedTapeRowIdx, finishedTapeColIdx) {
		for (const entry of finishedTapeRowIdx) {
			numRows = Math.max(entry.max() + 1, numRows);
		}

		for (const entry of finishedTapeColIdx) {
			numColumns = Math.max(entry.max() + 1, numColumns);
		}

		if (finalDecision === 'MISSING_TRANSITION' || finalDecision === 'UNDECIDED') {
			numRows = 1;
			numColumns = NUM_CELLS;
		}
	}

	function processInputString() {
		processedInputString = `#${inputString}#`;
	}

	function processInput() {
		processMachine();
		processInputString();
	}

	function createTable() {
		let table = '';
		for (let i = 0; i < numRows; i++) {
			let row = '';
			for (let j = 0; j < numColumns; j++) {
				row += `<td id = "${i}-${j}" class = "text-center">#</td>`;
			}
			row = `<tr>${row}</tr>`;
			table += row;
		}

		table = `<table id = "tape" class = "table table-bordered">${table}</table>`;
		$('#simulation-controls').css('display', 'block');

		return table;
	}

	function placeInputString() {
		for (let i = 0; i < processedInputString.length; i++) {
			$(`#0-${i}`).text(processedInputString[i]);
		}
	}

	function removeTapeHead() {
		for (let i = 0; i < numRows; i++) {
			for (let j = 0; j < numColumns; j++) {
				$(`#${i}-${j}`).attr('style', 'background-color: white; color: #212529');
			}
		}
	}

	function positionTapeHead(i, j) {
		$(`#${i}-${j}`).attr('style', 'background-color: rgb(160, 69, 84); color: white');
	}

	function updateTable() {
		removeTapeHead();
		positionTapeHead(finishedTapeRowIdx[config - 1][stepNumber - 1], finishedTapeColIdx[config - 1][stepNumber - 1]);
		$('#total-steps').text(finishedPaths[config - 1].length);
	}
});
