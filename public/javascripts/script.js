window.onload = function() {
	if (!data.done) {
		document.write("<h1>Waiting for data</h1>");
		timedRefresh(5000);
	} else {
		drawCategoriesHistogram();
		drawLocationHistogram();
	}
};

function timedRefresh(timeoutPeriod) {
	setTimeout("location.reload(true);", timeoutPeriod);
}

function drawCategoriesHistogram() {
	var chartData = new Array();
	var index = 0;
	for (var key in data.categories) {
		chartData.push([index++, data.categories[key] ]);
	};
	
	$.plot("#chartcategories", [{
		data : chartData,
		bars : {
			show : true
		}
	}]);
}


function drawLocationHistogram() {
	var chartData = new Array();
	var index = 0;
	for (var key in data.locations) {
		chartData.push([index++, data.locations[key] ]);
	};
	
	$.plot("#chartlocations", [{
		data : chartData,
		bars : {
			show : true
		}
	}]);
}
