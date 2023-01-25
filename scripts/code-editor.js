const editor = ace.edit('editor');
editor.getSession().setUseWrapMode(true);

const Range = ace.require('ace/range').Range;

function removeMarkers() {
	const prevMarkers = editor.session.getMarkers();

	if (prevMarkers) {
		const prevMarkersArr = Object.keys(prevMarkers);
		for (const item of prevMarkersArr) {
			editor.session.removeMarker(prevMarkers[item].id);
		}
	}
}

function resetEditor() {
	editor.setValue('');
	editor.setReadOnly(false);
	removeMarkers();
	$('#input-string').prop('readonly', false);
}

function getCurrentText() {
	const numLines = editor.session.getLength();
	let currentText = '';
	for (let i = 0; i < numLines; i++) {
		currentText += editor.session.getLine(i) + '\n';
	}

	return currentText;
}

function hasEditorChanges(previousText) {
	const currentText = getCurrentText();
	return currentText.trim().length > 0 && currentText.trim() != previousText.trim();
}

function highlightEditor(line, marker) {
	if (typeof line !== 'undefined') {
		editor.session.addMarker(new Range(line, 0, line, 1), marker, 'fullLine');
		editor.scrollToLine(line, true, true, function () {});
		editor.gotoLine(line + 1, 0, true);
	}
}
