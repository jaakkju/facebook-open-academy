/*
 * Configuration file for facebook-open-academy by Juhani Jaakkola
 */ 
var path = require('path');
var config = module.exports = {};

// set to true if you want analyzation to print analyzation result to console
config.print = false;

// set true if you want to display reset button
config.reset = true;

// remote JSON file url
config.JSON_url = 'http://pilvilinna.cert.fi/opendata/autoreporter/json.zip';

// local file names
config.JSON = 'json.zip';
config.analyzation = 'result.json';
config.folder = 'cert-fi_data';

// Worker file name
config.worker = 'worker.js';

// file destinations, do not touch
config.pathJSON = path.join(__dirname, config.folder, config.JSON);
config.pathAnalyzation = path.join(__dirname, config.folder, config.analyzation);
config.pathFolder = path.join(__dirname, config.folder);
config.pathWorker = path.join(__dirname, config.worker);