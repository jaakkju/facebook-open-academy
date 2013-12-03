/**
 * Author: Juhani Jaakkola
 * Started: 01.12.2013
 * Project name: facebook-open-academy
 * GitHub: https://github.com/mrnullbox/facebook-open-academy
 *
 * Call chaing in this solution after creating http.createServer if file does not exist
 * getZipZile -> unZipData -> analyzeData -> printAnalyzation
 *
 * json.zip is unzipped to filesJSON then analyzed and result stored analyzationResult
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

// Variables for storing JSON files and analyzation data
var filesJSON;
var analyzationResult = {
	done : false,
	from : undefined,
	to : undefined,
	days : 0,
	categories : {},
	locations : {}
};

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

app.get('/', function(req, res) {
	res.render('index', {
		title : 'CERT-FI: Open Data - Statistics from Autoreporter',
		subtitle : new Date(analyzationResult.from).toDateString() + ' - ' + new Date(analyzationResult.to).toDateString(),
		reset : config.reset,
		analyzationResult : analyzationResult
	});
});

app.get('/reset', function(req, res) {
	res.redirect('back');

	if (config.reset) {
		// TODO reset functionality
		console.log('reset');
	}
});

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));

	function printAnalyzationResult() {
		console.info('Incident categories and occurrencies frequency/day between ' + analyzationResult.from + ' - ' + analyzationResult.to + '\n');

		for (var key in analyzationResult.categories) {
			console.log(key + ' ' + analyzationResult.categories[key] / analyzationResult.days);
		}

		console.info('Incident locations and occurrencies between ' + analyzationResult.from + ' - ' + analyzationResult.to + '\n');

		for (var key in analyzationResult.locations) {
			console.log(key + ' ' + analyzationResult.locations[key]);
		}
	}

	function analyzeJSON() {
		console.info("Data structure ready, starting to analyze data...");

		var fileCounter = filesJSON.length;
		filesJSON.forEach(function(fileJSON) {
			fileCounter--;

			var dayCounter = fileJSON.autoreporter.opendata.length;
			fileJSON.autoreporter.opendata.forEach(function(day) {
				dayCounter--;

				// Capturing start and end dates
				var dateFrom = new Date(day.date.from);
				if (analyzationResult.from == undefined || analyzationResult.from.getTime() > dateFrom.getTime())
					analyzationResult.from = dateFrom;

				var dateTo = new Date(day.date.to);
				if (analyzationResult.to == undefined || analyzationResult.to.getTime() < dateTo.getTime())
					analyzationResult.to = dateTo;

				var occurrencyCounter = day.asn.length;
				day.asn.forEach(function(occurrency) {
					occurrencyCounter--;

					var ipaddressCounter = occurrency.ipaddress.length;
					occurrency.ipaddress.forEach(function(ipaddress) {
						ipaddressCounter--;

						// Creating new location to object if does not exist
						if (analyzationResult.locations.hasOwnProperty(ipaddress.city)) {
							analyzationResult.locations[ipaddress.city]++;
						} else {
							analyzationResult.locations[ipaddress.city] = 1;
						}

						var incidentCounter = ipaddress.incident.length;
						ipaddress.incident.forEach(function(incident) {
							incidentCounter--;

							// Creating new category to object if does not exist
							if (analyzationResult.categories.hasOwnProperty(incident.category.main)) {
								analyzationResult.categories[incident.category.main]++;
							} else {
								analyzationResult.categories[incident.category.main] = 1;
							}

							// After every loop is done, print the result and setting analyzation done
							if (fileCounter == 0 && dayCounter == 0 && occurrencyCounter == 0 && ipaddressCounter == 0 && incidentCounter == 0) {
								var oneDay = (1000 * 60 * 60 * 24);
								analyzationResult.days = Math.abs((analyzationResult.from.getTime() - analyzationResult.to.getTime()) / (oneDay));

								analyzationResult.done = true;

								fs.writeFile(config.pathAnalyzation, JSON.stringify(analyzationResult), function(err) {
									if (err)
										throw err;
									console.log('Analyzation saved to file ' + config.pathAnalyzation);
								});

								if (config.print)
									printAnalyzationResult();
							}
						});
					});
				});
			});
		});
	};

	function unZipData() {
		var zip = new admZip(config.pathJSON);
		var zipEntries = zip.getEntries();

		console.info(config.JSON + " contains " + zipEntries.length + " files, extracting to array");
		filesJSON = new Array(zipEntries.length);

		// Unzippping everything to data array as JSON objects then exec callback
		var index = 0;
		zipEntries.forEach(function(entry) {
			var entryName = entry.entryName;

			zip.readAsTextAsync(entry, function(data) {
				console.log('Decompressing ' + entryName + ' as a JSON object to array index ' + index);
				filesJSON[index++] = JSON.parse(data);

				if (index == zipEntries.length)
					analyzeJSON();
			});
		});
	};

	function getZipfile() {
		if (!path.existsSync(config.pathFolder))
			fs.mkdirSync(config.pathFolder);

		var lenght = 0;
		var file = fs.createWriteStream(config.pathJSON);
		var request = http.get(config.JSON_url, function(response) {

			var change = -1;
			console.log('Downloading file.. ' + config.JSON_url);

			response.on('data', function(chunk) {
				file.write(chunk);
				lenght += chunk.length;

				var percent = Math.round((lenght / response.headers['content-length']) * 100);

				if (change != percent) {
					change = percent;
					process.stdout.write(" " + percent + "%");
				}
			});

			response.on('end', function() {
				console.log();
				file.close();
			});

			file.on('close', function() {
				unZipData();
			});
		});
	};

	fs.exists(config.pathAnalyzation, function(exists) {
		// If analyzation exists we just read the data to variable
		if (exists) {
			fs.readFile(config.pathAnalyzation, function(err, data) {
				if (err)
					throw err;

				console.log('Analyzation file exist: ' + config.pathAnalyzation);
				analyzationResult = JSON.parse(data.toString());
				if (config.print)
					printAnalyzationResult();
			});
		} else {
			// Analyzation file does not exist, checking json.zip
			fs.exists(config.pathJSON, function(exists) {
				if (exists) {
					unZipData();
				} else {
					// json.zip does not exist downloading file
					console.warn(config.JSON + ' file does not exist...');
					getZipfile();
				}
			});
		}
	});

});
