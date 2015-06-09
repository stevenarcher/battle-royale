var assign = require('lodash.assign');
var babelify = require('babelify');
var browserify = require('browserify');
var browserSync = require('browser-sync');
var del = require('del');
var ghpages = require('gh-pages');
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var path = require('path');
var util = require('gulp-util');
var reload = browserSync.reload;
var runSequence = require('run-sequence');
var source = require('vinyl-source-stream');
var watchify = require('watchify');



/**
 * CONFIG
 * ============================================================================
 */
var sourcePath = './src/';
var distPath = './dist/';


/**
 * MAIN TASKS
 * ============================================================================
 */
gulp.task('default', ['dev']);

gulp.task('dev', function(callback) {
	runSequence('clean', 'lint', ['html', 'css'], 'serve', 'watch', callback);
});

gulp.task('build', function(callback) {
	runSequence('clean', 'lint', ['html', 'css', 'js'], callback);
});

gulp.task('deploy', function(callback) {
	runSequence('build', 'deploy-gh-pages', callback);
});


/**
 * SUB-TASKS
 * ============================================================================
 */
gulp.task('lint', function() {
	return gulp
			.src(['gulpfile.js', sourcePath + '**/*.js'])
			.pipe(eslint())
			.pipe(eslint.format())
			.pipe(eslint.failOnError());
});

gulp.task('clean', function() {
	return del(distPath + '**');
});

gulp.task('html', function() {
	return gulp
			.src(sourcePath + 'index.html')
			.pipe(gulp.dest(distPath));
});


gulp.task('css', function() {
	return gulp
			.src(sourcePath + 'styles/main.css')
			.pipe(gulp.dest(distPath));
});


gulp.task('js', function() {
	var options = {
		entries: [sourcePath + 'main.js'],
		debug: false
	};

	return browserify(options)
			.transform(babelify)
			.bundle()
			.pipe(source('app.js'))
			.pipe(gulp.dest(distPath));
});


gulp.task('serve', function() {
	return browserSync({
			server: {
				baseDir: distPath,
				open: true
			}
		});
});

gulp.task('watch', function() {

	watchHtml();
	watchCss();
	watchJs();

	function watchHtml() {
		gulp.watch('index.html', { cwd: sourcePath }, ['html', reload]);
	}

	function watchCss() {
		gulp.watch('styles/main.css', { cwd: sourcePath }, ['css', function() {
			reload(distPath + 'main.css');
		}]);
	}

	function watchJs() {
		var options = {
			entries: [sourcePath + 'main.js'],
			debug: false
		};
		options = assign({}, watchify.args, options);
		var bundler = watchify(browserify(options));

		bundler
			.transform(babelify)
			.on('update', bundle)
			.on('log', util.log);

		return bundle();

		function bundle() {
			return bundler
				.bundle()
				.on('error', util.log.bind(util, 'Browserify Error'))
				.pipe(source('app.js'))
				.pipe(gulp.dest(distPath))
				.pipe(reload({
					stream: true,
					once: true
				}));
		}
	}
});

gulp.task('deploy-gh-pages', function(cb) {
	return ghpages.publish(path.join(process.cwd(), distPath), cb);
});
