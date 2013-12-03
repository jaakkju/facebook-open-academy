/**
 * Author: Juhani Jaakkola
 * Started: 01.12.2013
 * Project name: facebook-open-academy
 * GitHub: https://github.com/mrnullbox/facebook-open-academy
 *
 * Call chaing in this solution after creating http.createServer if file does not exist
 * getZipZile -> unZipData -> analyzeData -> printAnalyzation
 */

 
 /**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');
var AdmZip = require('adm-zip');

var app = express();

// file variables
var file_name = 'json.zip';
var file_url = 'http://pilvilinna.cert.fi/opendata/autoreporter/json.zip';
var file_analyzation = __dirname + '/cert-fi_data/analyzation.json';
var file_dest = __dirname + '/cert-fi_data/' + file_name;
var files_JSON;


var analyzation = {
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
		title : 'Facebook’s Open Academy Program - Juhani Jaakkola',
		analyzation : analyzation
	});
});

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));

	function printAnalyzation() {
		console.log('Incident categories and occurrencies frequency/day between ' + analyzation.from + ' - ' + analyzation.to);
		console.log(analyzation.from);
		console.log(analyzation.to);
		for (var key in analyzation.categories) {
			console.log(key + ' ' + analyzation.categories[key] / analyzation.days);
		}

		console.log('Incident locations and occurrencies between ' + analyzation.from + ' - ' + analyzation.to);
		for (var key in analyzation.locations) {
			console.log(key + ' ' + analyzation.locations[key]);
		}
	}

	function analyzeData() {
		console.log("Data structure ready.. analyzing data...");

		var file_counter = files_JSON.length;
		files_JSON.forEach(function(JSON_file) {
			file_counter--;

			var day_counter = JSON_file.autoreporter.opendata.length;
			JSON_file.autoreporter.opendata.forEach(function(day) {
				day_counter--;

				// Capturing start and end dates
				var dateFrom = new Date(day.date.from);
				if (analyzation.from == undefined || analyzation.from.getTime() > dateFrom.getTime()) {
					analyzation.from = dateFrom;
				}

				var dateTo = new Date(day.date.to);
				if (analyzation.to == undefined || analyzation.to.getTime() < dateTo.getTime()) {
					analyzation.to = dateTo;
				}

				var occurrency_counter = day.asn.length;
				day.asn.forEach(function(occurrency) {
					occurrency_counter--;

					var ipaddress_counter = occurrency.ipaddress.length;
					occurrency.ipaddress.forEach(function(ipaddress) {
						ipaddress_counter--;

						// Creating new location to object if does not exist
						// TODO there is probably a nicer way to write this
						if (analyzation.locations.hasOwnProperty(ipaddress.city)) {
							analyzation.locations[ipaddress.city]++;
						} else {
							analyzation.locations[ipaddress.city] = 1;
						}

						var incident_counter = ipaddress.incident.length;
						ipaddress.incident.forEach(function(incident) {
							incident_counter--;

							// Creating new category to object if does not exist
							// TODO there is probably a nicer way to write this
							if (analyzation.categories.hasOwnProperty(incident.category.main)) {
								analyzation.categories[incident.category.main]++;
							} else {
								analyzation.categories[incident.category.main] = 1;
							}

							// After every loop is done, print the result and setting analyzation done
							if (file_counter == 0 && day_counter == 0 && occurrency_counter == 0 && ipaddress_counter == 0 && incident_counter == 0) {
								var oneDay = (1000 * 60 * 60 * 24);
								analyzation.days = Math.abs((analyzation.from.getTime() - analyzation.to.getTime()) / (oneDay));

								analyzation.done = true;

								fs.writeFile(file_analyzation, JSON.stringify(analyzation), function(err) {
									if (err)
										throw err;
									console.log('Analyzation saved to file ' + file_analyzation);
								});

								printAnalyzation();
							}
						});
					});
				});
			});
		});
	};

	function unZipData() {
		var zip = new AdmZip(file_dest);
		var zipEntries = zip.getEntries();

		console.log(file_name + " contains " + zipEntries.length + " files, extracting to array");
		files_JSON = new Array(zipEntries.length);

		// Unzippping everything to data array as JSON objects then exec callback
		var index = 0;
		zipEntries.forEach(function(entry) {
			var entryName = entry.entryName;

			zip.readAsTextAsync(entry, function(data) {
				console.log('Decompressing ' + entryName + ' as a JSON object to array index ' + index);
				files_JSON[index++] = JSON.parse(data);

				if (index == zipEntries.length) {
					analyzeData();
				}
			});
		});
	};

	function getZipfile() {
		console.log('Downloading file.. ' + file_url);

		var lenght = 0;
		var file = fs.createWriteStream(file_dest);
		var request = http.get(file_url, function(response) {

			var change = -1;
			response.on('data', function(chunk) {
				file.write(chunk);
				lenght += chunk.length;

				var percent = Math.round((lenght / response.headers['content-length']) * 100);

				if (change != percent) {
					change = percent;
					console.log('Downloading file ' + file_name + " " + percent + '%');
				}
			});

			response.on('end', function() {
				file.close();
				console.log(file_name + ' file downloaded');
			});

			file.on('close', function() {
				unZipData(analyzeData);
			});
		});
	};

	// TODO testing
	// TODO error handling, http, unzip, analyzation

	fs.exists(file_analyzation, function(exists) {
		// If analyzation exists we just read the data to variable
		if (exists) {
			fs.readFile(file_analyzation, function(err, data) {
				if (err)
					throw err;

				analyzation = JSON.parse(data.toString());
			});
		} else {

			// Analyzation file does not exist, checking json.zip
			fs.exists(file_dest, function(exists) {
				if (exists) {
					unZipData(analyzeData);
				} else {
					// json.zip does not exist downloading file
					getZipfile();
				}
			});
		}
	});
});
