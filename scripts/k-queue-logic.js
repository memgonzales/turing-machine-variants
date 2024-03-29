$(document).ready(function () {
	const editor = ace.edit('editor');

	const MAX_ITERATIONS = 1000;
	const NUM_CELLS = MAX_ITERATIONS;

	let initialState;
	let numQueues;
	let machine;
	let inputString;
	let rawMachine;
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
	let queues;
	let finalStates;

	let config;
	let stepNumber;

	let finishedPaths;
	let finishedTapeRowIdx;
	let finishedTapeColIdx;
	let finishedLineNumbers;
	let finishedDecision;

	let finalStatesLineNumbers;

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
		getRawMachine();
		processInput();
		removeMarkers();

		if (convertMachineToJS()) {
			appendTape();
			updateTable();

			$('#step-number').prop('max', finishedPaths[config].length);
		} else {
			removeTape();
		}

		if (finishedPaths[config].length == 1) {
			$('#prev').prop('disabled', true);
			$('#next').prop('disabled', true);
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
		numQueues = 0;
		machine = '';
		inputString = '';
		rawMachine = [];
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
		queues = [];
		finalStates = [];

		config = 1;
		stepNumber = 1;

		finishedPaths = [];
		finishedTapeRowIdx = [];
		finishedTapeColIdx = [];
		finishedLineNumbers = [];

		finalStatesLineNumbers = {};

		finalDecision = '';
		pathDecision = '';

		rejected = [];
		accepted = [];
		missingTransition = [];
		undecided = [];

		for (let i = 0; i < 1; i++) {
			const tapeRow = [];
			for (let j = 0; j < NUM_CELLS; j++) {
				tapeRow.push('#');
			}

			tape.push(tapeRow);
		}

		for (let i = 0; i < NUM_CELLS; i++) {
			const queueRow = [];
			queues.push(queueRow);
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

	function getRawMachine() {
		const machineLines = machine.split('\n');
		for (const line of machineLines) {
			const lineTrimmed = line.trim();
			rawMachine.push(lineTrimmed);
		}
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

		let firstLine = processedMachine[0].trim().split(' ');
		initialState = firstLine[0];
		numQueues = firstLine[1];

		/* Remove the initial state. */
		processedMachine.shift();

		initialStateLineNumber = processedMachineLineNumbers[0];
		processedMachineLineNumbers.shift();
	}

	function removeTape() {
		$('#break-tape').remove();
		$('#tape').remove();
		$('#queue').remove();
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

	function parseLineSimple(line) {
		let tokensRaw = line.split(' ');
		let tokens = [];

		for (const token of tokensRaw) {
			if (token.trim().length != 0) {
				tokens.push(token);
			}
		}

		let state = tokens[0].trim();

		let stimulus = '';
		let nextState = '';

		let directionStimulus = tokens[2];
		let directionRaw = directionStimulus[0];
		let direction = directionRaw.toUpperCase().trim();
		let directionTrue = '';

		/* Transition */

		stimulus = directionStimulus[directionStimulus.length - 2];
		directionTrue = directionStimulus.substring(0, directionStimulus.length - 3);
		direction = directionTrue;

		let nextStateParen = tokens[3];
		nextState = nextStateParen.slice(0, nextStateParen.length - 1).trim();

		return [String(state), String(stimulus), String(direction), String(nextState)];
	}

	function parseLine(line, lineNumber) {
		let tokensRaw = line.split(' ');
		let tokens = [];
		const MIN_NUM_TOKENS = 3;
		const MAX_NUM_TOKENS = 4;

		if (numQueues > MAX_ITERATIONS) {
			alert(`Line ${processedMachineLineNumbers[0] + 1}: System can only hold up to a maximum of ${MAX_ITERATIONS} queues.`);
			return false;
		}

		for (const token of tokensRaw) {
			if (token.trim().length != 0) {
				tokens.push(token);
			}
		}

		if (tokens.length < MIN_NUM_TOKENS) {
			alert(`Line ${lineNumber + 1}: Incomplete information about transition or final state. Expected number of whitespace-separated tokens is ${MIN_NUM_TOKENS} (for decision) or ${MAX_NUM_TOKENS} (for transition), but found ${tokens.length}.`);
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
		let directionTrue = '';

		/* Transition */
		if (tokens.length == MAX_NUM_TOKENS) {
			if (direction !== 'S' && direction !== 'W' && direction !== 'R') {
				alert(`Line ${lineNumber + 1}: Unknown action. Expected action to start with 'S', 'W', or 'R', but found '${directionStimulus[0].trim()}'.`);
				highlightEditor(lineNumber, 'marker3');
				return false;
			}

			let separatorComma = directionStimulus[directionStimulus.length - 1];
			if (separatorComma !== ',') {
				alert(`Line ${lineNumber + 1}: Expected ',' immediately after symbol '${stimulus}', but found ' '.`);
				highlightEditor(lineNumber, 'marker3');
				return false;
			}

			let separatorParen = directionStimulus[directionStimulus.length - 3];
			if (separatorParen !== '(') {
				alert(`Line ${lineNumber + 1}: Expected ')' to separate action and symbol, but found ${separatorParen}.`);
				highlightEditor(lineNumber, 'marker3');
				return false;
			}

			stimulus = directionStimulus[directionStimulus.length - 2];

			directionTrue = directionStimulus.substring(0, directionStimulus.length - 3);

			if (direction === 'S') {
				let leftRight = '';
				leftRight = directionTrue.substring(1, directionTrue.length);
				if (leftRight !== 'L' && leftRight !== 'R') {
					alert(`Line ${lineNumber + 1}: Expected 'SL' or 'SR' as action, but found '${directionTrue}'.`);
					highlightEditor(lineNumber, 'marker3');
					return false;
				}
			}

			if (direction === 'R' || direction === 'W') {
				let queueNumber = '';
				queueNumber = parseInt(directionTrue.substring(1, directionTrue.length));
				if (isNaN(queueNumber)) {
					alert(`Line ${lineNumber + 1}: Expected queue number after ${direction}, but found '${directionTrue.substring(1, directionTrue.length)}'.`);
					highlightEditor(lineNumber, 'marker3');
					return false;
				}

				if (queueNumber > numQueues) {
					alert(`Line ${lineNumber + 1}: Machine only has ${numQueues} queues, but found attempt to perform action on queue ${queueNumber}.`);
					return false;
				}
			}

			direction = directionTrue;

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

			if (decision !== 'final') {
				alert(`Line ${lineNumber + 1}: Unknown token. Expected 'final', but found '${decision}'.`);
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

	function isFinalState(state) {
		return typeof finalStates.find((x) => x == state) !== 'undefined';
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
				alert(`No specified transition from any state for symbol '${inputString[i]}'.`);
				const input = document.getElementById('input-string');
				input.focus();
				input.setSelectionRange(i, i + 1);
				return false;
			}
		}

		/* Check the initial state. */
		if (!stateSet.has(initialState)) {
			alert(`No specified transition from initial state '${initialState}'. The machine will not accept any string.`);
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

		return stimulusAlphabet.add('#');
	}

	function convertToAdjGraph() {
		let idx = 0;
		for (const line of parsedMachine) {
			let state = line[0];
			let stimulus = line[1];
			let direction = line[2];
			let nextState = line[3];

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
				finalStates.push(state);
				finalStatesLineNumbers[state] = processedMachineLineNumbers[idx];
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

	function copyArray(currentArray) {
		var newArray = [];

		for (var i = 0; i < currentArray.length; i++) {
			newArray[i] = currentArray[i].slice();
		}

		return newArray;
	}

	function extractQueueNumber(action) {
		return parseInt(action.substring(1, action.length));
	}

	function areAllQueuesEmpty(queues) {
		for (const queue of queues) {
			if (queue.length != 0) {
				return false;
			}
		}

		return true;
	}

	function generatePaths() {
		storeInputStringToTape();

		let finishedPaths = [];
		let finishedTapeRowIdx = [];
		let finishedTapeColIdx = [];
		let finishedLineNumbers = [];
		let finishedDecision = [];

		let unfinishedPaths = [[initialState]];
		let unfinishedTapeRowIdx = [[0]];
		let unfinishedTapeColIdx = [[0]];
		let unfinishedLineNumbers = [[]];
		let unfinishedQueues = [[copyArray(queues)]];

		let numIterations = 1;
		while (unfinishedPaths.length != 0 && numIterations <= MAX_ITERATIONS) {
			/* Go through every unfinished path */
			let unfinishedQueuesTemp = [];

			let unfinishedPathsTemp = [];
			let unfinishedTapeRowIdxTemp = [];
			let unfinishedTapeColIdxTemp = [];
			let unfinishedLineNumbersTemp = [];

			for (let i = 0; i < unfinishedPaths.length; i++) {
				let isValid = true;

				let queue = unfinishedQueues[i];
				let path = unfinishedPaths[i];
				let tapeRowIdx = unfinishedTapeRowIdx[i];
				let tapeColIdx = unfinishedTapeColIdx[i];
				let lineNumber = unfinishedLineNumbers[i];

				let currentQueue = queue[queue.length - 1];
				let currentState = path[path.length - 1];
				let currentTapeRowIdx = tapeRowIdx[tapeRowIdx.length - 1];
				let currentTapeColIdx = tapeColIdx[tapeColIdx.length - 1];

				switch (adjGraphDirection[currentState]) {
					case 'SR':
						currentTapeColIdx++;
						break;
					case 'SL':
						currentTapeColIdx--;
						if (currentTapeColIdx == -1) {
							isValid = false;
						}
						break;
				}

				if (isValid && numIterations < MAX_ITERATIONS) {
					let stimulus = tape[currentTapeRowIdx][currentTapeColIdx];
					let queueNumber = extractQueueNumber(adjGraphDirection[currentState]) - 1;

					if (adjGraphDirection[currentState][0] === 'R') {
						stimulus = currentQueue[queueNumber][0];
						console.log('q');
					}

					console.log(currentQueue[queueNumber]);
					console.log(stimulus);

					let nextStates = adjGraphNextState[currentState][stimulus];
					let currentLineNumbers = adjGraphLineNumber[currentState][stimulus];

					let nextQueues = [];

					let nextPaths = [];
					let nextTapeRowIdx = [];
					let nextTapeColIdx = [];
					let nextLineNumbers = [];

					if (adjGraphDirection[currentState][0] === 'W') {
						const stimuli = getStimulusAlphabet(1);

						nextStates = [];
						currentLineNumbers = [];

						for (const stimulus of stimuli) {
							nextStates = nextStates.concat(adjGraphNextState[currentState][stimulus]);
							currentLineNumbers = currentLineNumbers.concat(adjGraphLineNumber[currentState][stimulus]);

							let newNextStates = adjGraphNextState[currentState][stimulus];
							for (const state of newNextStates) {
								nextPaths.push(path.concat([state]));
								nextTapeRowIdx.push(tapeRowIdx.concat([currentTapeRowIdx]));
								nextTapeColIdx.push(tapeColIdx.concat([currentTapeColIdx]));

								/* Enqueue */
								let thisQueue = copyArray(currentQueue);
								thisQueue[queueNumber].push(stimulus);

								nextQueues.push(queue.concat([thisQueue]));
							}
						}
					}

					try {
						if (nextStates.length == 0) {
							finishedPaths.push(path);
							finishedTapeRowIdx.push(tapeRowIdx);
							finishedTapeColIdx.push(tapeColIdx);
							let lastLineNumber = adjGraphLineNumber[path[path.length - 1]];
							if (Number.isInteger(lastLineNumber)) {
								lineNumber.push(lastLineNumber);
							}

							if (isFinalState(path[path.length - 1]) && areAllQueuesEmpty(queue[queue.length - 1])) {
								lineNumber.push(finalStatesLineNumbers[path[path.length - 1]]);
								finishedDecision.push('Accepted');
							} else {
								if (numIterations == MAX_ITERATIONS) {
									finishedDecision.push('Cannot Decide');
								} else {
									finishedDecision.push('Rejected');

									if (isFinalState(path[path.length - 1])) {
										lineNumber.push(finalStatesLineNumbers[path[path.length - 1]]);
									}
								}
							}

							finishedLineNumbers.push(lineNumber);
						}
					} catch (err) {}

					if (adjGraphDirection[currentState][0] !== 'W') {
						try {
							for (const state of nextStates) {
								nextPaths.push(path.concat([state]));
								nextTapeRowIdx.push(tapeRowIdx.concat([currentTapeRowIdx]));
								nextTapeColIdx.push(tapeColIdx.concat([currentTapeColIdx]));

								/* Dequeue */
								console.log(currentState);
								console.table(nextStates);
								if (adjGraphDirection[currentState][0] === 'R' && nextStates.length != 0) {
									currentQueue[queueNumber].shift();
								}

								nextQueues.push(queue.concat([currentQueue]));
							}
						} catch (err) {
							finishedPaths.push(path);
							finishedTapeRowIdx.push(tapeRowIdx);
							finishedTapeColIdx.push(tapeColIdx);
							let lastLineNumber = adjGraphLineNumber[path[path.length - 1]];
							if (Number.isInteger(lastLineNumber)) {
								lineNumber.push(lastLineNumber);
							}

							if (isFinalState(path[path.length - 1]) && areAllQueuesEmpty(queue[queue.length - 1])) {
								lineNumber.push(finalStatesLineNumbers[path[path.length - 1]]);
								finishedDecision.push('Accepted');
							} else {
								if (numIterations == MAX_ITERATIONS) {
									finishedDecision.push('Cannot Decide');
								} else {
									finishedDecision.push('Rejected');

									if (isFinalState(path[path.length - 1])) {
										lineNumber.push(finalStatesLineNumbers[path[path.length - 1]]);
									}
								}
							}

							finishedLineNumbers.push(lineNumber);
						}
					}

					try {
						for (const line of currentLineNumbers) {
							nextLineNumbers.push(lineNumber.concat([line]));
						}
					} catch (err) {}

					unfinishedQueuesTemp = unfinishedQueuesTemp.concat(nextQueues);

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

					if (isFinalState(path[path.length - 1]) && areAllQueuesEmpty(queue[queue.length - 1])) {
						lineNumber.push(finalStatesLineNumbers[path[path.length - 1]]);
						finishedDecision.push('Accepted');
					} else {
						if (numIterations == MAX_ITERATIONS) {
							finishedDecision.push('Cannot Decide');
						} else {
							finishedDecision.push('Rejected');

							if (isFinalState(path[path.length - 1])) {
								lineNumber.push(finalStatesLineNumbers[path[path.length - 1]]);
							}
						}
					}

					finishedLineNumbers.push(lineNumber);
				}
			}

			if (numIterations < MAX_ITERATIONS) {
				unfinishedQueues = unfinishedQueuesTemp;

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

			finishedDecision.push('Cannot Decide');
		}

		return [finishedPaths, finishedTapeRowIdx, finishedTapeColIdx, finishedLineNumbers, finishedDecision];
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

		console.table(generatedPaths);

		finishedPaths = generatedPaths[0];
		finishedTapeRowIdx = generatedPaths[1];
		finishedTapeColIdx = generatedPaths[2];
		finishedLineNumbers = generatedPaths[3];
		finishedDecision = generatedPaths[4];

		getFinalDecision();
		getPathDecision();
		setNumRowsColumns(finishedTapeRowIdx, finishedTapeColIdx);

		return true;
	}

	function getFinalDecision() {
		rejected = [];
		accepted = [];
		missingTransition = [];
		undecided = [];

		for (let i = 0; i < finishedPaths.length; i++) {
			const path = finishedPaths[i];
			const decision = finishedDecision[i];

			switch (decision) {
				case 'Accepted':
					accepted.push(i);
					break;
				case 'Rejected':
					rejected.push(i);
					break;
				case 'Cannot Decide':
					undecided.push(i);
					break;
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
			let missingTransitionOpt = `<optgroup label = "Invalid">`;
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
			numColumns = Math.max(Math.max(entry.max() + 1, numColumns), inputString.length + 2);
		}

		if (finalDecision === 'MISSING_TRANSITION' || finalDecision === 'UNDECIDED') {
			numColumns = Math.max(numColumns, inputString.length + 2);
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

		let queueDisplay = '';
		for (let i = 1; i <= numQueues; i++) {
			let row = '';
			row += `<td id = "queue-${i}" class = "text-left" style = "width: 15%"> Queue ${i} </td>`;
			row += `<td id = "queue-contents-${i}" class = "text-left"></td>`;

			row = `<tr>${row}</tr>`;
			queueDisplay += row;
		}

		queueDisplay = `<table id = "queue" class = "table table-bordered">${queueDisplay}</table>`;
		table += queueDisplay;

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
				return `Reached ${MAX_ITERATIONS} steps without reaching accepting/rejecting state`;
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
		updateTapeContents();
	}

	function updateTapeContents() {
		for (let i = 0; i < 1; i++) {
			for (let j = 0; j < NUM_CELLS; j++) {
				tape[0][j] = '#';
			}
		}

		storeInputStringToTape();

		const origStepNumber = stepNumber;
		stepNumber = 1;

		for (let i = 0; i < numRows; i++) {
			for (let j = 0; j < numColumns; j++) {
				$(`#${i}-${j}`).text('#');
			}
		}
		placeInputString();

		for (let i = 1; i <= numQueues; i++) {
			$(`#queue-contents-${i}`).text('');
		}

		while (stepNumber < origStepNumber) {
			stepNumber++;
			updateTapeContentsStep();
		}
	}

	function updateTapeContentsStep() {
		const currentLineNumber = finishedLineNumbers[config][stepNumber - 2];
		const action = parseLineSimple(rawMachine[currentLineNumber])[2];
		const stimulus = parseLineSimple(rawMachine[currentLineNumber])[1];

		let trueAction = '';

		switch (action[0]) {
			case 'R':
			case 'W':
				trueAction = action;
		}

		const queueNumber = extractQueueNumber(trueAction);

		if (typeof queueNumber !== 'undefined') {
			const currentContents = $(`#queue-contents-${queueNumber}`).text();
			switch (action[0]) {
				case 'R':
					$(`#queue-contents-${queueNumber}`).text(currentContents.substring(1, currentContents.length));
					$(`#queue-contents-${queueNumber}`).css('letter-spacing', '1em');
					break;
				case 'W':
					$(`#queue-contents-${queueNumber}`).text(currentContents + stimulus);
					$(`#queue-contents-${queueNumber}`).css('letter-spacing', '1em');
					break;
			}
		}
	}
});
