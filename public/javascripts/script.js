$(document).ready(function() {
	if (!data.done) {
		timedRefresh(10000);
	} else {
		// TODO This page refreshing while waiting for data could be done with background ajax call 
		// To get it working more nicely
		if (data.working)
			timedRefresh(10000);

		var previousPoint = null;

		drawCategoriesHistogram();
		drawLocationHistogram();
		drawTimeline();

		$("#categories").tablesorter({
			sortList : [[1, 1]]
		});
		$("#locations").tablesorter({
			sortList : [[1, 1]]
		});
	}

	function timedRefresh(timeoutPeriod) {
		setTimeout("location.reload(true);", timeoutPeriod);
	}

	function showTooltip(x, y, contents) {
		$('<div id="tooltip">' + contents + '</div>').css({
			position : 'absolute',
			display : 'none',
			top : y + 10,
			left : x + 10,
			border : '1px solid #3D4C0D',
			padding : '2px',
			color : '#FFFFFF',
			'background-color' : '#87A235',
			opacity : 0.90
		}).appendTo("body").fadeIn(200);
	}

	function drawCategoriesHistogram() {
		var cData = new Array();
		var cTicks = new Array();
		var index = 0;
		for (var key in data.categories) {
			cTicks.push([index, key]);
			cData.push([index++, (data.categories[key] / data.days)]);
		};

		var dataSet = [{
			bars : {
				show : true,
				fill : 1,
				align : "center",
				barWidth : 0.5
			},
			data : cData,
			color : "#98BF21",
			highlightColor : "#87a235"
		}];

		var options = {
			grid : {
				show : true,
				hoverable : true,
				autoHighlight : true
			},
			yaxis : {
				transform : function(x) {
					return Math.sqrt(x);
				},
			},
			xaxis : {
				ticks : cTicks,
				autoscaleMargin : 0.010
			}
		};

		$.plot("#chartcategories", dataSet, options);

		$("#chartcategories").bind("plothover", function(event, pos, item) {
			if (item) {
				if (previousPoint != item.dataIndex) {
					previousPoint = item.dataIndex;
					$("#tooltip").remove();

					var x = cTicks[item.datapoint[0]][1];
					var y = item.datapoint[1].toFixed(3);
					showTooltip(pos.pageX, pos.pageY, x + ": " + y);
				}
			} else {
				$("#tooltip").remove();
				previousPoint = null;
			}
		});
	}

	function drawLocationHistogram() {
		var cData = new Array();
		var cTicks = new Array();
		var index = 0;
		for (var key in data.locations) {
			cTicks.push([index, key]);
			cData.push([index++, (data.locations[key] / data.days)]);
		};

		var dataSet = [{
			data : cData,
			color : "#98BF21",
			highlightColor : "#87a235",
			bars : {
				show : true,
				fill : 1
			}
		}];

		var options = {
			grid : {
				show : true,
				hoverable : true,
				autoHighlight : true
			},
			yaxis : {
				transform : function(x) {
					return Math.sqrt(x);
				},
			}
		};

		$.plot("#chartlocations", dataSet, options);

		$("#chartlocations").bind("plothover", function(event, pos, item) {
			if (item) {
				if (previousPoint != item.dataIndex) {
					previousPoint = item.dataIndex;
					$("#tooltip").remove();

					var x = cTicks[item.datapoint[0]][1];
					var y = item.datapoint[1].toFixed(3);
					showTooltip(pos.pageX, pos.pageY, x + ": " + y);
				}
			} else {
				$("#tooltip").remove();
				previousPoint = null;
			}
		});
	}

	function drawTimeline() {
		var month_names = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");
		var cData = new Array();
		for (var year in data.incidents) {
			for (var month in data.incidents[year]) {
				var time = new Date(year, month);
				cData.push([time.getTime(), data.incidents[year][month]]);
			}
		};

		cData.sort(function(a, b) {
			return a[0] - b[0];
		});

		var series = [{
			color : "#98BF21",
			data : cData
		}];

		var options = {
			series : {
				lines : {
					show : true
				},
				points : {
					show : true
				}
			},
			grid : {
				hoverable : true,
				autoHighlight : true
			},
			xaxis : {
				tickFormatter : function(val, axis) {
					var x = new Date(val);
					return month_names[x.getMonth()] + '/' + x.getFullYear();
				}
			}

		};

		$.plot("#chartTimeline", series, options);

		$("#chartTimeline").bind("plothover", function(event, pos, item) {
			if (item) {
				if (previousPoint != item.dataIndex) {
					previousPoint = item.dataIndex;
					$("#tooltip").remove();

					var x = new Date(item.datapoint[0]);
					var y = item.datapoint[1];
					showTooltip(pos.pageX, pos.pageY, month_names[x.getMonth()] + '/' + x.getFullYear() + " - " + y);
				}
			} else {
				$("#tooltip").remove();
				previousPoint = null;
			}
		});
	}

});
