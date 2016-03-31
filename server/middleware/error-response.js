/**
* HTTP Error handling middleware that attaches an error method to the Express reponse object
* This streamlines error handling in routes and adds in logging.
* Follows error logging syntax, but if only two params are sent it assumes the second is the log message.
* Note that only 4xx HTTP statuses should omit an Error object.
*
* @param {number} status - HTTP status code to send, also dictates page to render
* @param {Error} [err] - Error to log
* @param {string} msg - Message to return to client
*/

module.exports = function(req, res, next) {
	// Attach the error object to the response
	res.error = function(status, err, msg) {
		// Default status
		if(!status) {
			status = 500;
		}

		// If only two parameters are sent, assume there is no error object, or default the message to the err.message
		if(!msg) {
			if(!(err instanceof Error)) {
				msg = err;
				err = null;
			} else if(err instanceof Error) {
				msg = err.message;
			}
		}

		if(req.xhr) {
			// Send the error back to the client via JSON
			res.status(status).json({success: false, message: msg, error: err});
			logError();
		} else {
			// Render an error page
			res.status(status).render(status >= 500 ? '50x' : '40x', {message: msg, error: err, status: status}, function(err, html){
				res.send(html);
				logError();
			});								
		}

		// app.render is async, so this needs to be called in the callback, as well as immediately after res.json
		function logError() {
			if (err){
				// If it's an actual server error, log it as such
				req.log.error({req: req, err: err, res: res}, err.message);
			} else {
				// Otherwise just log it as a bad request
				req.log.warn({req: req, res: res}, msg);
			}
		}
	};

	next();
};