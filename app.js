/**
 * Author: Juhani Jaakkola
 * Started: 01.12.2013
 * Email: juhani@jaakkola.net
 * Homepage: http://juhani@jaakkola.net
 *
 * Project name: facebook-open-academy
 * GitHub: https://github.com/nullbox/facebook-open-academy
 *
 * json.zip is unzipped to filesJSON then analyzed and result stored result
 * This result is passed to browser when requested
 *
 * Set print true in config.json if you want analyzation result to be printed to console
 */

// Module dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');
var admZip = require('adm-zip');
var app = express();

// Configuration file
var config = require(path.join(__dirname, 'config.js'));

// Aanalyzation result
var result = {};

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

function printResult(result) {
	var from = new Date(result.from).toDateString();
	var to = new Date(result.to).toDateString();

	if (config.print) {
		console.info('Incident categories and occurrencies frequency/day (' + result.categories.length + ') between ' + from + ' - ' + to + '\n');

		for (var key in result.categories) {
			console.log(key + ' ' + result.categories[key] / result.days);
		}

		console.info('Incident locations and occurrencies (' + result.locations.length + ') between ' + from + ' - ' + to + '\n');

		for (var key in result.locations) {
			console.log(key + ' ' + result.locations[key] / result.days);
		}
	}

	if (config.days) {
		console.info('Incident occurrences per month between ' + from + ' - ' + to + '\n');

		var months = 0, incidents = 0;
		for (var year in result.incidents) {
			for (var month in result.incidents[year]) {
				months++;
				incidents += result.incidents[year][month];
				console.log(month + ':' + year + ' ' + result.incidents[year][month]);
			}
		}
		console.log('Total ' + months + ' months ' + incidents + ' incidents');
	}
}

function startWorker(msg) {
	if (!result.working) {
		result.working = true;

		// Kicking off a new process to do the hard work, downloading the file and analyzation
		console.info("Starting new fileworker process to do the heavy lifting");

		var startTime = new Date();
		var worker = require('child_process').fork(config.pathWorker);
		worker.send(msg);

		worker.on('message', function(data) {
			console.log('Worker took: ' + (new Date().getTime() - startTime.getTime()) + " milliseconds");
			result = data;
			worker.send('exit');

			printResult(result);
		});

		worker.on('exit', function(code) {
			if (code) {
				console.error('Exiting worker process abnormaly, pid: ' + process.pid);
				result.working = false;
			} else {
				console.log('Ending worker process, pid: ' + process.pid);
				result.working = false;
			}
		});
	}
}

app.get('/', function(req, res) {
	res.render('index', {
		title : result.done ? 'CERT-FI: Open Data - Statistics from Autoreporter' : 'Waiting for data...',
		subtitle : result.done ? new Date(result.from).toDateString() + ' - ' + new Date(result.to).toDateString() : "",
		reset : !result.working ? config.reset : false,
		init : result.done ? false : true,
		result : result
	});
});

app.get('/reset', function(req, res) {
	res.redirect('back');

	if (config.reset) {
		console.warn('Reset call received, downloading data again');
		startWorker('reset');
	}
});

app.get('/init', function(req, res) {
	res.redirect('back');

	console.log('Init call received, checking if data exists');
	fs.exists(config.pathAnalyzation, function(exists) {

		// If analyzation exists we just read the data to variable
		if (exists) {
			fs.readFile(config.pathAnalyzation, function(err, data) {
				if (err)
					console.error('Error while reading file ' + config.pathAnalyzation, err);
				try {
					result = JSON.parse(data.toString());
					printResult(result);
				} catch (err) {
					console.error('Error while parsing ' + config.pathAnalyzation + " to JSON", err);
				}
			});
		} else {
			// Analyzation does not exist, starting worker
			startWorker('start');
		}
	});

});

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});
