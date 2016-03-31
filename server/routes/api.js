/*
* Page Router - Serves home page and all server page routes
*
* @exports Express Router
*/

var apiRouter = require('express').Router(),
	async = require('async'),
	_ = require('lodash'),
	config = require('../config');

module.exports = apiRouter;