const editor = ace.edit('editor');
editor.getSession().setUseWrapMode(true);

const Range = ace.require('ace/range').Range;
// editor.session.addMarker(new Range(1, 0, 1, 1), 'myMarker', 'fullLine');

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
