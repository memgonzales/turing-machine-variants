$(document).ready(function () {
	const editor = ace.edit('editor');

	const MAX_ITERATIONS = 1000;
	const NUM_CELLS = MAX_ITERATIONS;

	let initialState;
	let machine;
	let inputString;
	let processedMachine;
	let processedMachineLineNumbers;
	let processedInputString;
	let initialStateLineNumber;

	/* Each element is of the form:
	   [state, direction, stimulus, next state, decision] */
	let parsedMachine;
	let adjGraphDirection;
	let adjGraphNextState;
	let adjGraphLineNumber;

	let numColumns;
	let numRows;
	let tape;

	let config;
	let stepNumber;

	let finishedPaths;
	let finishedTapeRowIdx;
	let finishedTapeColIdx;
	let finishedLineNumbers;

	let finalDecision;
	let pathDecision;

	let rejected;
	let accepted;
	let missingTransition;
	let undecided;

	editor.on('input', function () {
		if (getCurrentText().trim() == 0) {
			$('#run').prop('disabled', true);
		} else if ($('#test-cases').val() !== 'instructions') {
			$('#run').prop('disabled', false);
		}
	});

	$('#step-number').keyup(function (event) {
		if (event.keyCode === 13) {
			stepNumber = $('#step-number').val();
			if (parseInt(stepNumber) < 1) {
				$('#step-number').val('1');
				stepNumber = 1;
			} else if (parseInt(stepNumber) > finishedPaths[config].length) {
				$('#step-number').val(finishedPaths[config].length);
				stepNumber = finishedPaths[config].length;
			}

			updateTable();
		}
	});

	$('#test-cases').change(function (e) {
		resetInputAttributes();
		removeTape();
	});

	$('#config').change(function (e) {
		config = $(e.currentTarget).val();
		resetNecessaryOnly();
		updateTable();
		getPathDecision();
		updateDisplayDecision();
	});

	$('#run').on('click', function () {
		resetInputAttributes();
		getInput();
		processInput();
		removeMarkers();

		if (convertMachineToJS()) {
			appendTape();
			updateTable();

			$('#step-number').prop('max', finishedPaths[config].length);
		} else {
			removeTape();
		}
	});

	$('#next').on('click', function () {
		stepNumber++;
		$('#prev').prop('disabled', false);

		if (stepNumber > finishedPaths[config].length) {
			stepNumber = finishedPaths[config].length;
		}

		if (stepNumber == finishedPaths[config].length) {
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
		initialStateLineNumber = 0;

		parsedMachine = [];
		adjGraphDirection = {};
		adjGraphNextState = {};
		adjGraphLineNumber = {};

		numColumns = 0;
		numRows = 0;
		tape = [];

		config = 1;
		stepNumber = 1;

		finishedPaths = [];
		finishedTapeRowIdx = [];
		finishedTapeColIdx = [];
		finishedLineNumbers = [];

		finalDecision = '';
		pathDecision = '';

		rejected = [];
		accepted = [];
		missingTransition = [];
		undecided = [];

		for (let i = 0; i < NUM_CELLS; i++) {
			const tapeRow = [];
			for (let j = 0; j < NUM_CELLS; j++) {
				tapeRow.push('#');
			}

			tape.push(tapeRow);
		}

		$('#step-number').val(stepNumber);
		$('#prev').prop('disabled', true);
		$('#next').prop('disabled', false);

		$('#config').html('');
	}

	function resetNecessaryOnly() {
		stepNumber = 1;

		$('#step-number').val(stepNumber);
		$('#prev').prop('disabled', true);
		$('#next').prop('disabled', false);
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

		initialStateLineNumber = processedMachineLineNumbers[0];
		processedMachineLineNumbers.shift();
	}

	function removeTape() {
		$('#break-tape').remove();
		$('#tape').remove();
		$('#simulation-controls').hide();
		$('#simulation-config').hide();
	}

	function appendTape() {
		removeTape();
		$('#simulation').append('<br id = "break-tape">' + createTable());
		placeInputString();
		positionTapeHead(0, 0);

		$('#simulation-config').css('display', 'block');
	}

	function parseLine(line, lineNumber) {
		let tokensRaw = line.split(' ');
		let tokens = [];
		const MIN_NUM_TOKENS = 3;
		const MAX_NUM_TOKENS = 4;

		for (const token of tokensRaw) {
			if (token.trim().length != 0) {
				tokens.push(token);
			}
		}

		if (tokens.length < MIN_NUM_TOKENS) {
			alert(`Line ${lineNumber + 1}: Incomplete information about transition or accepting/rejecting state. Expected at least ${MIN_NUM_TOKENS} whitespace-separated tokens, but found only ${tokens.length}.`);
			highlightEditor(lineNumber, 'marker3');
			return false;
		}

		if (tokens.length > MAX_NUM_TOKENS) {
			alert(`Line ${lineNumber + 1}: Invalid transition. Expected at most ${MAX_NUM_TOKENS} whitespace-separated tokens, but found ${tokens.length}.`);
			highlightEditor(lineNumber, 'marker3');
			return false;
		}

		let state = tokens[0].trim();
		let separatorBracket = tokens[1];

		if (separatorBracket.trim() !== ']') {
			alert(`Line ${lineNumber + 1}: Expected ' ] ' after state name '${state}', but found '${separatorBracket}'.`);
			highlightEditor(lineNumber, 'marker3');
			return false;
		}

		let stimulus = '';
		let nextState = '';
		let decision = '';

		let directionStimulus = tokens[2];
		let directionRaw = directionStimulus[0];
		let direction = directionRaw.toUpperCase().trim();

		/* Transition */
		if (tokens.length == MAX_NUM_TOKENS) {
			if (direction !== 'R' && direction !== 'L') {
				alert(`Line ${lineNumber + 1}: Unknown direction. Expected 'R' or 'L', but found '${directionStimulus[0].trim()}'.`);
				highlightEditor(lineNumber, 'marker3');
				return false;
			}

			let separatorParen = directionStimulus[1];
			if (separatorParen !== '(') {
				/* Account for R followed by space. */
				let found = ' ';
				if (typeof separatorParen != 'undefined') {
					found = separatorParen;
				}

				alert(`Line ${lineNumber + 1}: Expected '(' immediately after direction '${directionRaw.trim()}', but found '${found}'.`);
				highlightEditor(lineNumber, 'marker3');
				return false;
			}

			stimulus = directionStimulus[2];
			const LEN_DIRECTION_STIMULUS = 4;
			let separatorComma1 = directionStimulus[3];

			if (directionStimulus.length > LEN_DIRECTION_STIMULUS) {
				alert(`Line ${lineNumber + 1}: Expected single-symbol stimulus, but found stimulus starting with '${stimulus}${directionStimulus[3]}'`);
				highlightEditor(lineNumber, 'marker3');
				return false;
			}

			if (directionStimulus.length >= LEN_DIRECTION_STIMULUS && separatorComma1 !== ',') {
				alert(`Line ${lineNumber + 1}: Expected single-symbol stimulus, but found stimulus starting with '${stimulus}${directionStimulus[3]}'`);
				highlightEditor(lineNumber, 'marker3');
				return false;
			}

			if (directionStimulus.length == LEN_DIRECTION_STIMULUS - 1) {
				alert(`Line ${lineNumber + 1}: Expected ',' immediately after stimulus ${stimulus}, but found ' '`);
				highlightEditor(lineNumber, 'marker3');
				return false;
			}

			if (directionStimulus.length == LEN_DIRECTION_STIMULUS - 2) {
				alert(`Line ${lineNumber + 1}: No stimulus found.`);
				highlightEditor(lineNumber, 'marker3');
				return false;
			}

			let nextStateParen = tokens[3];
			nextState = nextStateParen.slice(0, nextStateParen.length - 1).trim();

			if (nextStateParen[nextStateParen.length - 1] !== ')') {
				alert(`Line ${lineNumber + 1}: Expected ')' immediately after name of next state`);
				highlightEditor(lineNumber, 'marker3');
				return false;
			}

			if (nextState.length == 0) {
				alert(`Line ${lineNumber + 1}: Expected name of next state.`);
				highlightEditor(lineNumber, 'marker3');
				return false;
			}
		} else {
			decision = directionStimulus.toLowerCase().trim();

			if (decision !== 'reject' && decision !== 'accept') {
				alert(`Line ${lineNumber + 1}: Unknown decision. Expected 'reject' or 'accept', but found '${decision}'. If you meant to enter a transition, check if there is a space between the comma and the name of the next state`);
				highlightEditor(lineNumber, 'marker3');
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
			adjGraphLineNumber[state] = {};

			for (const stimulus of stimulusAlphabet) {
				adjGraphNextState[state][stimulus] = [];
				adjGraphLineNumber[state][stimulus] = [];
			}
		}

		/* Check the input string. */
		for (let i = 0; i < inputString.length; i++) {
			if (!stimulusAlphabet.has(inputString[i])) {
				alert(`Position ${i + 1}: Input string contains symbol '${inputString[i]}', which is not part of the input alphabet.`);
				const input = document.getElementById('input-string');
				input.focus();
				input.setSelectionRange(i, i + 1);
				return false;
			}
		}

		/* Check the initial state. */
		if (!stateSet.has(initialState)) {
			alert(`Initial state '${initialState}' is not part of the state set.`);
			highlightEditor(initialStateLineNumber, 'marker3');
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
					alert(`Line ${processedMachineLineNumbers[idx] + 1}: A state can be associated with only one direction.`);
					highlightEditor(processedMachineLineNumbers[idx], 'marker3');
					return false;
				}
				adjGraphDirection[state] = direction;
				adjGraphNextState[state][stimulus].push(nextState);
				adjGraphLineNumber[state][stimulus].push(processedMachineLineNumbers[idx]);
			} else {
				if (adjGraphDirection[state].length > 0 && decision != adjGraphDirection[state]) {
					alert(`Line ${processedMachineLineNumbers[idx] + 1}: A state can be associated with only one decision.`);
					highlightEditor(processedMachineLineNumbers[idx], 'marker3');
					return false;
				}

				adjGraphDirection[state] = decision;
				adjGraphLineNumber[state] = processedMachineLineNumbers[idx];
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
		let finishedLineNumbers = [];

		let unfinishedPaths = [[initialState]];
		let unfinishedTapeRowIdx = [[0]];
		let unfinishedTapeColIdx = [[0]];
		let unfinishedLineNumbers = [[]];

		let numIterations = 1;
		while (unfinishedPaths.length != 0 && numIterations <= MAX_ITERATIONS) {
			/* Go through every unfinished path */
			let unfinishedPathsTemp = [];
			let unfinishedTapeRowIdxTemp = [];
			let unfinishedTapeColIdxTemp = [];
			let unfinishedLineNumbersTemp = [];

			for (let i = 0; i < unfinishedPaths.length; i++) {
				let isValid = true;
				let path = unfinishedPaths[i];
				let tapeRowIdx = unfinishedTapeRowIdx[i];
				let tapeColIdx = unfinishedTapeColIdx[i];
				let lineNumber = unfinishedLineNumbers[i];

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
					let currentLineNumbers = adjGraphLineNumber[currentState][stimulus];

					let nextPaths = [];
					let nextTapeRowIdx = [];
					let nextTapeColIdx = [];
					let nextLineNumbers = [];

					if (nextStates.length == 0) {
						finishedPaths.push(path);
						finishedTapeRowIdx.push(tapeRowIdx);
						finishedTapeColIdx.push(tapeColIdx);
						let lastLineNumber = adjGraphLineNumber[path[path.length - 1]];
						if (Number.isInteger(lastLineNumber)) {
							lineNumber.push(lastLineNumber);
						}
						finishedLineNumbers.push(lineNumber);
					}

					for (const state of nextStates) {
						nextPaths.push(path.concat([state]));
						nextTapeRowIdx.push(tapeRowIdx.concat([currentTapeRowIdx]));
						nextTapeColIdx.push(tapeColIdx.concat([currentTapeColIdx]));
					}

					try {
						for (const line of currentLineNumbers) {
							nextLineNumbers.push(lineNumber.concat([line]));
						}
					} catch (err) {}

					unfinishedPathsTemp = unfinishedPathsTemp.concat(nextPaths);
					unfinishedTapeRowIdxTemp = unfinishedTapeRowIdxTemp.concat(nextTapeRowIdx);
					unfinishedTapeColIdxTemp = unfinishedTapeColIdxTemp.concat(nextTapeColIdx);
					unfinishedLineNumbersTemp = unfinishedLineNumbersTemp.concat(nextLineNumbers);
				} else {
					finishedPaths.push(path);
					finishedTapeRowIdx.push(tapeRowIdx);
					finishedTapeColIdx.push(tapeColIdx);
					let lastLineNumber = adjGraphLineNumber[path[path.length - 1]];
					if (Number.isInteger(lastLineNumber)) {
						lineNumber.push(lastLineNumber);
					}
					lineNumber.push(lastLineNumber);
					finishedLineNumbers.push(lineNumber);
				}
			}

			if (numIterations < MAX_ITERATIONS) {
				unfinishedPaths = unfinishedPathsTemp;
				unfinishedTapeRowIdx = unfinishedTapeRowIdxTemp;
				unfinishedTapeColIdx = unfinishedTapeColIdxTemp;
				unfinishedLineNumbers = unfinishedLineNumbersTemp;
			}

			numIterations++;
		}

		if (unfinishedPaths.length != 0) {
			finishedPaths = unfinishedPaths;
			finishedTapeRowIdx = unfinishedTapeRowIdx;
			finishedTapeColIdx = unfinishedTapeColIdx;
			finishedLineNumbers = unfinishedLineNumbers;
		}

		return [finishedPaths, finishedTapeRowIdx, finishedTapeColIdx, finishedLineNumbers];
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
		finishedLineNumbers = generatedPaths[3];

		getFinalDecision();
		getPathDecision();
		setNumRowsColumns(finishedTapeRowIdx, finishedTapeColIdx);

		console.log(generatedPaths);

		return true;
	}

	function getFinalDecision() {
		rejected = [];
		accepted = [];
		missingTransition = [];
		undecided = [];

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
			config = accepted[0];
		} else if (rejected.length != 0) {
			finalDecision = 'REJECTED';
			config = rejected[0];
		} else if (missingTransition.length != 0) {
			finalDecision = 'MISSING_TRANSITION';
			config = missingTransition[0];
		} else {
			finalDecision = 'UNDECIDED';
			config = undecided[0];
		}

		if (accepted.length != 0) {
			let acceptedOpt = `<optgroup label = "Accepted">`;
			for (const i of accepted) {
				acceptedOpt += `<option value = "${i}">${i + 1}</option>`;
			}
			acceptedOpt += `</optgroup>`;

			$('#config').append(acceptedOpt);
		}

		if (rejected.length != 0) {
			let rejectedOpt = `<optgroup label = "Rejected">`;
			for (const i of rejected) {
				rejectedOpt += `<option value = "${i}">${i + 1}</option>`;
			}
			rejectedOpt += `</optgroup>`;

			$('#config').append(rejectedOpt);
		}

		if (missingTransition.length != 0) {
			let missingTransitionOpt = `<optgroup label = "Invalid Machine">`;
			for (const i of missingTransition) {
				missingTransitionOpt += `<option value = "${i}">${i + 1}</option>`;
			}
			missingTransitionOpt += `</optgroup>`;

			$('#config').append(missingTransitionOpt);
		}

		if (undecided.length != 0) {
			let undecidedOpt = `<optgroup label = "Cannot decide">`;
			for (const i of undecided) {
				undecidedOpt += `<option value = "${i}">${i + 1}</option>`;
			}
			undecidedOpt += `</optgroup>`;

			$('#config').append(undecidedOpt);
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

	function getPathDecision() {
		if (typeof accepted.find((x) => x == config) !== 'undefined') {
			pathDecision = 'ACCEPTED';
		} else if (typeof rejected.find((x) => x == config) !== 'undefined') {
			pathDecision = 'REJECTED';
		} else if (typeof missingTransition.find((x) => x == config) !== 'undefined') {
			pathDecision = 'MISSING_TRANSITION';
		} else {
			pathDecision = 'UNDECIDED';
		}
	}

	function prettifyDecision(decision) {
		switch (decision) {
			case 'ACCEPTED':
			case 'REJECTED':
				return decision;
			case 'MISSING_TRANSITION':
				return 'INVALID MACHINE';
			case 'UNDECIDED':
				return 'CANNOT DECIDE';
		}
	}

	function emojiDecision(decision) {
		switch (decision) {
			case 'ACCEPTED':
				return '✔️';
			case 'REJECTED':
				return '❌';
			case 'MISSING_TRANSITION':
				return '❗';
			case 'UNDECIDED':
				return '❓';
		}
	}

	function prettifySubDecision(decision) {
		switch (decision) {
			case 'MISSING_TRANSITION':
				return 'This error was caused by either (1) an incomplete set of transition functions or (2) the tape head attempting to access a prohibited cell (note that the tape extends infinitely in only one direction).';
			case 'UNDECIDED':
				return `Exceeded ${MAX_ITERATIONS} steps without reaching accepting/rejecting state`;
		}
	}

	function updateDisplayDecision() {
		$('#final-decision').text(prettifyDecision(finalDecision));
		$('#final-decision-emoji').text(emojiDecision(finalDecision));
		switch (finalDecision) {
			case 'ACCEPTED':
			case 'REJECTED':
				$('#final-decision-sub').text('');
				break;
			case 'MISSING_TRANSITION':
			case 'UNDECIDED':
				$('#final-decision-sub').text(prettifySubDecision(finalDecision));
		}

		$('#config-decision-header').css('display', 'block');
		$('#config-decision').text(prettifyDecision(pathDecision));
		switch (pathDecision) {
			case 'ACCEPTED':
			case 'REJECTED':
				$('#config-decision-sub').text('');
				break;
			case 'MISSING_TRANSITION':
			case 'UNDECIDED':
				$('#config-decision-sub').text(prettifySubDecision(pathDecision));
		}
	}

	function updateTable() {
		removeTapeHead();
		positionTapeHead(finishedTapeRowIdx[config][stepNumber - 1], finishedTapeColIdx[config][stepNumber - 1]);
		$('#total-steps').text(finishedPaths[config].length);

		removeMarkers();
		highlightEditor(finishedLineNumbers[config][stepNumber - 1], 'marker1');
		updateDisplayDecision();
	}
});
