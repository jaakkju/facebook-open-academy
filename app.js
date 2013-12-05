/**
 * Author: Juhani Jaakkola
 * Started: 01.12.2013
 * Project name: facebook-open-academy
 * GitHub: https://github.com/mrnullbox/facebook-open-academy
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
	console.info('Incident categories and occurrencies frequency/day between ' + result.from + ' - ' + result.to + '\n');

	for (var key in result.categories) {
		console.log(key + ' ' + result.categories[key] / result.days);
	}

	console.info('Incident locations and occurrencies between ' + result.from + ' - ' + result.to + '\n');

	for (var key in result.locations) {
		console.log(key + ' ' + result.locations[key]);
	}
}

function startWorker(msg) {
	if (!result.working) {
		result.working = true;

		// Kicking off a new process to do the hard work, downloading the file and analyzation
		var startTime = new Date();
		var worker = require('child_process').fork(config.pathWorker);
		worker.send(msg);

		worker.on('message', function(data) {
			console.log('Worker took: ' + (new Date().getTime() - startTime.getTime()) + " milliseconds");
			result = data;
			worker.send('exit');
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

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));

	fs.exists(config.pathAnalyzation, function(exists) {
		// If analyzation exists we just read the data to variable
		if (exists) {
			fs.readFile(config.pathAnalyzation, function(err, data) {
				if (err)
					throw err;

				console.log('Analyzation file exist: ' + config.pathAnalyzation);
				result = JSON.parse(data.toString());
				if (config.print)
					printResult(result);
			});
		} else {
			// Analyzation does not exist, starting worker
			startWorker('start');
		}
	});
});
