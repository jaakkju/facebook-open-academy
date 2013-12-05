$(document).ready(function() {
	if (!data.done) {
		timedRefresh(5000);
	} else {
		drawCategoriesHistogram();
		drawLocationHistogram();
		$("table").tablesorter({
			sortList : [[0, 0]]
		});
	}
});

function timedRefresh(timeoutPeriod) {
	setTimeout("location.reload(true);", timeoutPeriod);
}

function drawCategoriesHistogram() {
	var cData = new Array();
	var cTicks = new Array();
	var index = 0;
	for (var key in data.categories) {
		cTicks.push([index, key]);
		cData.push([index++, data.categories[key]]);
	};

	var dataSet = [{
		bars : {
			show : true,
			fill : 1,
			align : "center",
			barWidth: 0.7
		},
		data : cData,
		color : "#98BF21"
	}];

	var options = {
		xaxis : {
			ticks : cTicks,
			autoscaleMargin: 0.010
		}
	};

	$.plot("#chartcategories", dataSet, options);
}

function drawLocationHistogram() {
	var cData = new Array();
	var index = 0;
	for (var key in data.locations) {
		cData.push([index++, data.locations[key]]);
	};

	var dataSet = [{
		data : cData,
		color : "#98BF21",
		bars : {
			show : true,
			fill : 1
		}
	}];

	var options = {
		xaxis : {
			ticks : []
		}
	};

	$.plot("#chartlocations", dataSet, options);
}