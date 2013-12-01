window.onload = function() {
	if (!data.done) {
		document.write("<h1>Waiting for data</h1>");
		timedRefresh(5000);
	} else {
		//drawLocationHistogram();
	}
};

function timedRefresh(timeoutPeriod) {
	setTimeout("location.reload(true);", timeoutPeriod);
}

function drawLocationHistogram() {
	var chartData = new Array();
	data.locations.forEach(function () {
		// TODO data for chart
	});
	
	$.plot("#chartlocations", [{
		data : data.locations,
		bars : {
			show : true
		}
	}]);
}
