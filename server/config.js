/**
* Application config
* Don't set dev defaults here, all sensitive/dynamic parameters should come from enviroment variables, and fail if not present
* Non-sensitive data is ok to be hardcoded, provided it's equal across all environments
*
* @exports config object
*/

module.exports = {
	session: {
		secret: process.env.SESSION_SECRET || 'development'
	},
	redis: {
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT
	}
};