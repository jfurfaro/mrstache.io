/*
* Mr. Stache Entrypoint
*/

var path = require('path'),
	express = require('express'),
	_ = require('lodash'),
	responseTime = require('response-time'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	RedisStore = require('connect-redis')(session),
	config = require('./config'),
	errorResponse = require('./middleware/error-response'),
	log = require('./services/log'),
	apiRouter = require('./routes/api');


// --------------------------------------------------
// APP SETUP

var app = express();

app.set('trust proxy', true);
app.disable('x-powered-by');


_.mixin({
	defaultsDeep: require('defaults-deep-safe')
});

// END APP SETUP
// --------------------------------------------------


// --------------------------------------------------
// MIDDLEWARE

// Short circuit static assets
app.use(express.static(path.resolve(__dirname, '..', 'client/dist')));

// Child logger per request
app.use(log.requestLog);

// Add a response time to the response object
app.use(responseTime(function(req, res, time){
	res.responseTime = time;
}));

// Attach an error handler to the response object
app.use(errorResponse);

// Body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Cookies and session
app.use(cookieParser());
// app.use(session({
// 	name: 'mrstache.sid',
// 	secret: config.session.secret,
// 	resave: false,
// 	saveUninitialized: true,
// 	store: new RedisStore({
// 		host: config.redis.host,
// 		port: config.redis.port,
// 		disableTTL: true
// 	})
// }));


// END MIDDLEWARE
// --------------------------------------------------


// --------------------------------------------------
// ROUTES

app.use('/api', apiRouter);
app.get('/', function(req, res, next){
	res.status(200).sendFile(path.resolve(__dirname, '..', 'client/dist/index.html'));
});

// END ROUTES
// --------------------------------------------------


// --------------------------------------------------
// 404 AND ERROR HANDLING

app.use(function(req, res, next){
	// res.error(404, 'Resource not Found');
	res.status(404).json('Resource not Found');
});

app.use(function(err, req, res, next){
	// res.error(500, err, 'Something broke');
	res.status(500).json('Something broke');
});

// END 404 AND ERROR HANDLING
// --------------------------------------------------

var server = app.listen(4000, function(){
	log.info('Mr. Stache listening on port %s', server.address().port);
});