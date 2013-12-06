$(document).ready(function() {
	if (!data.done) {
		timedRefresh(5000);
	} else {
		drawCategoriesHistogram();
		drawLocationHistogram();
		$("#categories").tablesorter({
			sortList : [[1, 1]]
		});
		$("#locations").tablesorter({
			sortList : [[1, 1]]
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
			barWidth : 0.5
		},
		data : cData,
		color : "#98BF21"
	}];

	var options = {
		grid : {
			hoverable : true,
		},
		yaxis : {
			// TODO do this with a function
			ticks : [0, 1, 10, 100, 4000, 1000, 10000, 25000, 50000, 100000, 200000, 400000, 600000, 800000, 1000000],
			transform : function(x) {
				return Math.sqrt(Math.sqrt(x));
			},
			autoscaleMargin : 0.010
		},
		xaxis : {
			ticks : cTicks,
			autoscaleMargin : 0.010
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
		yaxis : {
			// TODO do this with a function
			ticks : [0, 1, 10, 100, 400, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 200000],
			transform : function(x) {
				return Math.sqrt(Math.sqrt(x));
			},
			autoscaleMargin : 0.010
		},
		xaxis : {
			ticks : []
		}
	};

	$.plot("#chartlocations", dataSet, options);
}