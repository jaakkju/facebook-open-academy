/**
 *  File worker that is started by the main server process. It downloads and anylyzes the zile in a different process
 *  leaving the main process for the server
 *
 *  We could kick off more processes for the analyzation, eg. each per file. I think this program to be mostly web application that server
 *  analyzation, but offers a way for the mainteiner to download the file again.
 *
 *  Call chaing in this solution after creating http.createServer if file does not exist
 *  getZipZile -> unZipData -> analyzeData
 */

var path = require('path');
var fs = require('fs');
var admZip = require('adm-zip');
var http = require('http');
var winston = require('winston');

// Configuration file
var config = require(path.join(__dirname, 'config.js'));

var logger = new winston.Logger({
	transports : [new winston.transports.Console({
		level : config.console,
		handleExceptions : true,
		colorize : true
	}), new winston.transports.File({
		filename : config.pathLog,
		level : config.file,
		handleExceptions : true
	})],
});

function analyzeJSON(filesJSON) {
	logger.info("Data structure ready, starting to analyze data...");

	var result = {
		from : undefined,
		to : undefined,
		days : 0,
		categories : {},
		locations : {},
		incidents : {}
	};

	var fileCounter = filesJSON.length;
	filesJSON.forEach(function(fileJSON) {
		fileCounter--;

		var dayCounter = fileJSON.autoreporter.opendata.length;
		fileJSON.autoreporter.opendata.forEach(function(day) {
			dayCounter--;

			// Capturing start and end dates
			var dateFrom = new Date(day.date.from);
			if (result.from == undefined || result.from.getTime() > dateFrom.getTime())
				result.from = dateFrom;

			var dateTo = new Date(day.date.to);
			if (result.to == undefined || result.to.getTime() < dateTo.getTime())
				result.to = dateTo;

			// Creating new year and month to object if does not exist
			if (!result.incidents.hasOwnProperty(dateFrom.getFullYear()))
				result.incidents[dateFrom.getFullYear()] = {};

			if (!result.incidents[dateFrom.getFullYear()].hasOwnProperty(dateFrom.getMonth()))
				result.incidents[dateFrom.getFullYear()][dateFrom.getMonth()] = 0;

			var occurrencyCounter = day.asn.length;
			day.asn.forEach(function(occurrency) {
				occurrencyCounter--;

				var ipaddressCounter = occurrency.ipaddress.length;
				occurrency.ipaddress.forEach(function(ipaddress) {
					ipaddressCounter--;

					var location = ipaddress.city + '-' + ipaddress.cc;

					// Creating new location to object if does not exist
					if (result.locations.hasOwnProperty(location)) {
						result.locations[location]++;
					} else {
						result.locations[location] = 1;
					}

					var incidentCounter = ipaddress.incident.length;
					ipaddress.incident.forEach(function(incident) {
						incidentCounter--;

						// Counting every incident under a month
						result.incidents[dateFrom.getFullYear()][dateFrom.getMonth()]++;

						// Creating new category to object if does not exist
						if (result.categories.hasOwnProperty(incident.category.main)) {
							result.categories[incident.category.main]++;
						} else {
							result.categories[incident.category.main] = 1;
						}

						// After every loop is done, print the result and setting analyzation done
						if (fileCounter == 0 && dayCounter == 0 && occurrencyCounter == 0 && ipaddressCounter == 0 && incidentCounter == 0) {
							var oneDay = (1000 * 60 * 60 * 24);
							result.days = Math.abs((result.from.getTime() - result.to.getTime()) / (oneDay));

							result.done = true;

							fs.writeFile(config.pathAnalyzation, JSON.stringify(result), function(err) {
								if (err) {
									logger.error('Error while result file to ' + config.pathAnalyzation + ', Error: ', err);
									process.exit(1);
								}

								logger.info('Analyzation saved to file ' + config.pathAnalyzation);

								// Pass results back to parent process
								process.send(result);
							});
						}
					});
				});
			});
		});
	});
};

var unZipData = function unZipData() {

	try {
		var zip = new admZip(config.pathJSON);
		var zipEntries = zip.getEntries();

		logger.info(config.JSON + " contains " + zipEntries.length + " files, extracting to array");
		var filesJSON = new Array(zipEntries.length);

		// Unzippping everything to data array as JSON objects then exec callback
		var index = 0;

		zipEntries.forEach(function(entry) {

			var entryName = entry.entryName;

			zip.readAsTextAsync(entry, function(data) {
				logger.info('Decompressing ' + entryName + ' as a JSON object to array index ' + index);

				try {
					filesJSON[index++] = JSON.parse(data);
					if (index == zipEntries.length)
						analyzeJSON(filesJSON);
				} catch(err) {
					fs.unlink(config.pathJSON, function() {
						logger.error('JSON parsing failed, deleting existing file, please try again. Error: ', err);
						process.exit(1);
					});
				}
			});
		});
	} catch(err) {
		fs.unlink(config.pathJSON, function() {
			logger.error('Reading ' + config.JSON + ' failed, deleting existing file, please try again. Error:', err);
			process.exit(1);
		});
	}
};

function getZipfile() {
	logger.info('Checking if ' + config.pathFolder + ' exists, creating if does not');

	fs.mkdir(config.pathFolder, function() {
		var lenght = 0;
		var file = fs.createWriteStream(config.pathJSON);
		var request = http.get(config.JSON_url, function(response) {

			var change = -1;
			logger.info('Downloading file.. ' + config.JSON_url);

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
				process.nextTick(unZipData);
			});
		});
	});
};

// Worker process starts: analyzation file does not exist, checking json.zip
process.on('message', function(data) {
	if (data === 'start') {
		fs.exists(config.pathJSON, function(exists) {
			if (exists) {
				logger.warn(config.JSON + ' exists, but there is no ' + config.analyzation + ', starting unzip');
				unZipData();
			} else {
				logger.warn(config.JSON + ' file does not exist...');
				getZipfile();
			}
		});
	} else if (data === 'reset') {
		getZipfile();
	} else if (data === 'exit') {
		process.exit(0);
	}
});
