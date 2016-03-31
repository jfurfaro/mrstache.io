var path = require('path'),
	gulp = require('gulp'),
	browserify = require('browserify'),
	watchify = require('watchify'),
	uglify = require('gulp-uglify'),
	exorcist = require('exorcist'),
	changed = require('gulp-changed'),
	less = require('gulp-less'),
	cleanCss = require('gulp-clean-css'),
	autoprefix = require('gulp-autoprefixer'),
	nodeNotifier = require('node-notifier'),
	notify = require('gulp-notify'),
	livereload = require('gulp-livereload'),
	source = require('vinyl-source-stream'),
	buffer = require('vinyl-buffer'),
	sourceDir = 'client/lib/',
	buildDir = 'client/dist/',
	vendorLibs = [
		'lodash'
	],
	mapfile = 'scripts/app.js.map';

// Error handler
function handleError(err) {
	console.log('\033[1;37;41m[ERROR!] ' + err.message + '\033[49m');
	nodeNotifier.notify({
		title: 'COMPILE ERROR',
		message: 'Your file did not compile:\n' + err.message,
		sound: true
	});

	this.emit('end');
}

gulp.task('styles', function(){
	return gulp.src(sourceDir + 'styles/main.less')
		.pipe(less().on('error', handleError))
		.pipe(autoprefix({browsers: ['last 2 versions', 'not ie <= 8']}))
		.pipe(cleanCss({keepSpecialComments: 0, processImport: false}).on('error', handleError))
		.pipe(gulp.dest(buildDir + 'styles/'))
		.pipe(notify(function(file){return 'CSS Compiled'}))
		.pipe(livereload({ auto: false }));
});

gulp.task('html', function(){
	return gulp.src(sourceDir + '**.html')
		.pipe(changed(buildDir))
		.pipe(gulp.dest(buildDir))
		.pipe(notify(function(file){return 'HTML Updated'}))
		.pipe(livereload({ auto: false }));
});

gulp.task('images', function(){
	return gulp.src(sourceDir + 'images/*')
		.pipe(gulp.dest(buildDir + 'images/'))
		.pipe(notify(function(file){return 'Images Copied'}));
});

var b = browserify({
			entries: sourceDir + 'scripts/app.js',
			extensions: ['.jsx'],
			debug: true,
			paths: ['./node_modules'],
			transform: [
				'uglifyify'
			],
			plugin: [watchify],
			cache: {},
			packageCache: {}
		});

// Mark all the vendor libraries as external dependencies
for (var i = 0; i < vendorLibs.length; i++) {
	if(typeof vendorLibs[i] === 'string') {
		b.external(vendorLibs[i]);
	} else {
		b.external(vendorLibs[i].expose);
	}
}
	
b = watchify(b, {ignoreWatch: true});

b.on('update', bundle);

function bundle(){
	return b.bundle()
			.on('error', handleError)
			.pipe(exorcist(path.join(__dirname, buildDir, mapfile)))
			.pipe(source('scripts/app.js'))
			.pipe(buffer())
			.pipe(gulp.dest(buildDir))
			.pipe(notify(function(file){return 'App JS Updated'}))
			.pipe(livereload({ auto: false }));
}

gulp.task('vendor', function(){
	var bV = browserify({
			transform: [
				'browserify-shim',
				'uglifyify'
			]
		});

	bV.require(vendorLibs);

	return bV.bundle().on('error', handleError)
		.pipe(source('scripts/vendor.js'))
		.pipe(buffer())
		.pipe(uglify())
		.pipe(gulp.dest(buildDir))
		.pipe(notify(function(file){return 'Vendor JS Compiled'}));
});


gulp.task('default', function(){
	bundle();
	livereload.listen();
	gulp.watch(sourceDir + 'styles/*.less', ['styles']);
	gulp.watch(sourceDir + '**.html', ['html']);
	gulp.watch(sourceDir + 'images/*', ['images']);

	console.log('\033[36m Watching Assets\033[39m');
});

gulp.task('build', ['styles', 'html', 'images', 'vendor'], function(){
	bundle();
	console.log('\033[36m Built Assets\033[39m');
});
