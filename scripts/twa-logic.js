$(document).ready(function () {
	const editor = ace.edit('editor');

	const MAX_ITERATIONS = 10000;

	let machine = '';
	let sanitizedMachine = '';
	let inputString = '';

	let numColumns = 0;
	let numRows = 1;

	$('#run').on('click', function () {
		getInput();
		sanitizeMachine();
		prepareTape();
		appendTable();
	});

	function getInput() {
		machine = getCurrentText();
		inputString = $('#input-string').val();
	}

	function sanitizeMachine() {}

	function prepareTape() {
		/* +2 for the initial and terminal # */
		numColumns = inputString.length + 2;
	}

	function createTable() {
		let table = '';
		for (let i = 0; i < numRows; i++) {
			let row = '';
			for (let j = 0; j < numColumns; j++) {
				row += `<td id = "${i}-${j}">#</td>`;
			}
			row = `<tr>${row}</tr>`;
			table += row;
		}

		table = `<table class = "table table-bordered">${table}</table>`;
		return table;
	}

	function appendTable() {
		$('#simulation').append(createTable());
	}
});
