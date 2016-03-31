/**
* Log service
*
* @exports a singleton Bunyan log instance for logging use
*/

var path = require('path'),
    _ = require('lodash'),
	bunyan = require('bunyan'),
	bunyanDebugStream = require('bunyan-debug-stream'),
	uuid = require('uuid'),
	config = require('../config');

// Custom serializer for the response object
function resSerializer(res) {
	if (!res || !res.statusCode) return res;

	return {
		statusCode: res.statusCode,
		responseTime: res.responseTime,
		headers: res._headers
	};
}

// Custom serialize for the request object
function reqSerializer(req) {
    if (!req || !req.connection) return req;

    var obj = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        remoteAddress: req.connection.remoteAddress,
        remotePort: req.connection.remotePort
    };

    return obj;
};

// Error stack handler
function getFullErrorStack(err) {
    var ret = err.stack || err.toString();
    if (err.cause && typeof (err.cause) === 'function') {
        var cex = err.cause();
        if (cex) {
            ret += '\nCaused by: ' + getFullErrorStack(cex);
        }
    }
    return (ret);
}

// Custom Error serializer to encompass custom error types
function errSerializer(err) {
    if (!err || !err.stack) return err;

    var obj = {
        message: err.message,
        name: err.name,
        stack: getFullErrorStack(err),
        code: err.code,
        signal: err.signal
    };

    // Default the rest of the properties
    _.defaultsDeep(obj, err);

    return obj;
};

// Add streams based on config
var consoleDebugStream = {
		level: 'debug',
		type: 'raw',
		stream: bunyanDebugStream({basepath: __dirname})
	},
    consoleJsonStream = {
        level: 'info',
        stream: process.stdout
    },
	logStreams = [];

if(process.env.NODE_ENV === 'production') {
    logStreams.push(consoleJsonStream);
} else {
    logStreams.push(consoleDebugStream);
}

// Create the logger
var log = bunyan.createLogger({
	name: 'Mr. Stache',
	streams: logStreams,
    serializers: {
        req: reqSerializer,
        res: resSerializer,
        err: errSerializer
    }
});

// Attach a child logger middleware function - it serializes all fields upon creation, so req should be included when the actual logging happens
log.requestLog = function(req, res, next) {
	req.log = log.child({req_id: uuid.v4()});

    // Also log every good request after response is sent
    req.on('end', function(){
        if(res.statusCode >= 200 && res.statusCode < 400){
            req.log.info({req: req, res: res}, req.method + ' ' + req.url + ' ' + res.statusCode);
        }
    });
	
	next();
};

module.exports = log;