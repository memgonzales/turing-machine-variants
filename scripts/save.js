$(document).ready(function () {
	$('#save').on('click', function () {
		save();
	});

	function save() {
		let textcontent = getCurrentText();
		let downloadableLink = document.createElement('a');
		downloadableLink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textcontent));
		downloadableLink.download = 'machine.txt';
		document.body.appendChild(downloadableLink);
		downloadableLink.click();
		document.body.removeChild(downloadableLink);
	}
});
