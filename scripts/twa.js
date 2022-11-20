$(document).ready(function () {
	let editor = ace.edit('editor');

	let previous;

	const START = { row: 0, column: 0 };

	$('#test-cases')
		.on('focus', function () {
			previous = this.value;
		})
		.change(function (e) {
			if (!editor.session.getUndoManager().isClean()) {
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
		editor.setValue('');
		let selected = $(e.currentTarget).val();

		switch (selected) {
			case 'custom':
				custom();
				break;
			case 'a-before-b':
				aBeforeB();
				break;
		}
	}

	function custom() {
		editor.session.insert(START, '');
	}

	function aBeforeB() {
		lines = ['1 ] R(a, 1)', '1 ] R(b, 2)', '1 ] R(#, 3)'];
		editor.session.insert(START, lines.join('\n'));
	}
});
