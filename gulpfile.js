'use strict';

// modules
var assemble = require('fabricator-assemble');
var browserSync = require('browser-sync');
var gulpPlugins = require('gulp-load-plugins');
var $ = gulpPlugins();
var del = require('del');
var gulp = require('gulp');
console.log($);
var reload = browserSync.reload;
var runSequence = require('run-sequence');
var webpack = require('webpack');

var postcss     = require('gulp-postcss');
var reporter    = require('postcss-reporter');
var syntax_scss = require('postcss-scss');
var stylelint   = require('stylelint');

// configuration
var config = {
	dev: $.util.env.dev,
	src: {
		scripts: {
			fabricator: './src/assets/fabricator/scripts/fabricator.js'
			//toolkit: './src/assets/toolkit/scripts/toolkit.js'
		},
		styles: {
			fabricator: 'src/assets/fabricator/styles/fabricator.scss',
			toolkit: 'src/assets/toolkit/styles/toolkit.scss',
			toolkitDir: 'src/assets/toolkit/styles/'
		},
		images: 'src/assets/toolkit/images/**/*',
		views: 'src/toolkit/views/*.html',
		svgIcons: 'src/assets/toolkit/svgIcons/*.svg'
	},
	dest: 'dist'
};

// webpack
var webpackConfig = require('./webpack.config')(config);
var webpackCompiler = webpack(webpackConfig);


// clean
gulp.task('clean', function (cb) {
	del([config.dest], cb);
});


// styles
gulp.task('styles:fabricator', function () {
	gulp.src(config.src.styles.fabricator)
		.pipe($.sourcemaps.init())
		.pipe($.sass().on('error', $.sass.logError))
		.pipe($.autoprefixer('last 1 version'))
		.pipe($.if(!config.dev, $.csso()))
		.pipe($.rename('f.css'))
		.pipe($.sourcemaps.write())
		.pipe(gulp.dest(config.dest + '/assets/fabricator/styles'))
		.pipe($.if(config.dev, reload({stream:true})));
});



gulp.task("styles:lint", function() {

  // Stylelint config rules
  var stylelintConfig = {
    "rules": {
			"max-empty-lines": 5,
			"max-line-length": 80,
			"max-nesting-depth": 4,
			"no-duplicate-selectors": true,
			"no-eol-whitespace": true,
			"no-extra-semicolons": true,
			"no-indistinguishable-colors": true,
			"media-query-parentheses-space-inside": "never",
			"media-feature-colon-space-after": "always",
			"media-feature-colon-space-before": "never",
			"media-feature-no-missing-punctuation": true,
			"media-feature-range-operator-space-after": "always",
			"media-feature-range-operator-space-before": "always",
			"rule-nested-empty-line-before": "always",
			"rule-non-nested-empty-line-before": "always",
			"selector-attribute-brackets-space-inside": "never",
			"selector-attribute-operator-space-after": "never",
			"selector-attribute-operator-space-before": "never",
			"selector-combinator-space-after": "always",
			"selector-combinator-space-before": "always",
			"selector-max-compound-selectors": 4,
			"selector-max-specificity": "0,3,3",
			"selector-no-qualifying-type": true,
			"selector-no-universal": true,
			"selector-pseudo-class-case": "lower",
			"selector-pseudo-class-no-unknown": true,
			"selector-pseudo-class-parentheses-space-inside": "never",
			"selector-pseudo-element-case": "lower",
			"selector-pseudo-element-colon-notation": "single",
			"selector-type-case": "lower",
			"selector-type-no-unknown": true,
			"selector-max-empty-lines": 0,
			"color-no-invalid-hex": true,
			"color-hex-case": "lower",
			"font-family-name-quotes": "always-unless-keyword",
			"number-leading-zero": "never",
			"length-zero-no-unit": true,
			"unit-no-unknown": true,
			"value-keyword-case": "lower",
			"value-list-comma-space-after": "always-single-line",
			"value-list-comma-space-before": "never",
			"shorthand-property-no-redundant-values": true,
			"declaration-block-no-ignored-properties": true,
      "declaration-block-no-duplicate-properties": true,
      "declaration-block-no-shorthand-property-overrides": true,
      "function-linear-gradient-no-nonstandard-direction": true
    }
  }

  var processors = [
    stylelint(stylelintConfig),
    reporter({
      clearMessages: true,
      throwError: false
    })
  ];

  gulp.src(config.src.styles.toolkitDir+'**/*')
    .pipe(postcss(processors, {syntax: syntax_scss}));
});

gulp.task('styles:toolkit', function () {
	gulp.src(config.src.styles.toolkit)
		.pipe($.sourcemaps.init())
		.pipe($.sass({outputStyle: 'expanded'}).on('error', $.sass.logError))
		.pipe($.combineMq({	beautify: false	}))
		.pipe($.autoprefixer({ browsers: ['last 3 versions']}))
		.pipe($.imageEmbed({
			asset: config.src.images,
			extension: ['jpg', 'png']
		}))
		.pipe($.if(!config.dev, $.csso()))
		.pipe($.sourcemaps.write())
		.pipe(gulp.dest(config.dest + '/assets/toolkit/styles'))
		.pipe($.if(config.dev, reload({stream:true})));

});

gulp.task('styles', ['styles:fabricator', 'styles:toolkit', 'styles:lint']);


gulp.task('scriptsShame', ['modernizr'],function () {
	return gulp.src(['./src/assets/toolkit/scripts/**/*'])
		.pipe(gulp.dest(config.dest + '/assets/toolkit/scripts'));
});

gulp.task('modernizr', function () {
	return gulp.src(['./src/assets/toolkit/scripts/**/*'])
		.pipe($.modernizr({"tests": ['svg', 'flexbox']})) //https://github.com/Modernizr/customizr/blob/develop/test/js/vanilla.js
		.pipe(gulp.dest(config.dest + '/assets/toolkit/scripts'));
});

// scripts
gulp.task('scripts', function (done) {
	webpackCompiler.run(function (error, result) {
		if (error) {
			$.util.log($.util.colors.red(error));
		}
		result = result.toJson();
		if (result.errors.length) {
			result.errors.forEach(function (error) {
				$.util.log($.util.colors.red(error));
			});
		}
		done();
	});
});


// images
gulp.task('images', ['favicon', 'svgIcons'], function () {
	return gulp.src(config.src.images)
		.pipe($.imagemin())
		.pipe(gulp.dest(config.dest + '/assets/toolkit/images'));
});

gulp.task('favicon', function () {
	return gulp.src('./src/favicon.ico')
		.pipe(gulp.dest(config.dest));
});

gulp.task('svgIcons', function () {
	return gulp.src(config.src.svgIcons)
		.pipe($.svgmin())
		.pipe($.svgstore())
		.pipe(gulp.dest(config.dest + '/assets/toolkit/svgIcons'));
});


// assemble
gulp.task('assemble', function (done) {
	assemble({
		logErrors: config.dev
	});
	done();
});


// server
gulp.task('serve', function () {

	browserSync({
		server: {
			baseDir: config.dest
		},
		notify: false,
		logPrefix: 'FABRICATOR'
	});

	/**
	 * Because webpackCompiler.watch() isn't being used
	 * manually remove the changed file path from the cache
	 */
	function webpackCache(e) {
		var keys = Object.keys(webpackConfig.cache);
		var key, matchedKey;
		for (var keyIndex = 0; keyIndex < keys.length; keyIndex++) {
			key = keys[keyIndex];
			if (key.indexOf(e.path) !== -1) {
				matchedKey = key;
				break;
			}
		}
		if (matchedKey) {
			delete webpackConfig.cache[matchedKey];
		}
	}

	gulp.task('assemble:watch', ['assemble'], reload);
	gulp.watch('src/**/*.{html,md,json,yml}', ['assemble:watch']);

	gulp.task('styles:fabricator:watch', ['styles:fabricator']);
	gulp.watch('src/assets/fabricator/styles/**/*.scss', ['styles:fabricator:watch']);

	gulp.task('styles:toolkit:watch', ['styles:toolkit'], reload);
	gulp.watch('src/assets/toolkit/styles/**/*.scss', ['styles:toolkit:watch']);

	gulp.task('scripts:watch', ['scripts'], reload);
	gulp.watch('src/assets/{fabricator}/scripts/**/*.js', ['scripts:watch']).on('change', webpackCache);

	gulp.task('scriptsShame:watch', ['scriptsShame']);
	gulp.watch('src/assets/toolkit/scripts/**/*.js', ['scriptsShame:watch']);

	gulp.task('svgIcons:watch', ['svgIcons'], reload);
	gulp.watch(config.src.svgIcons, ['svgIcons:watch']);

	gulp.task('images:watch', ['images'], reload);
	gulp.watch(config.src.images, ['images:watch']);

});

gulp.task('test', ['styles'], function(){
	return gulp.src(config.dest + '/assets/toolkit/styles/**/*.css')
			.pipe($.plumber())
			.pipe($.colorguard({
					logOk: true,
					treshold: 3
			}))
			.pipe($.plumber())
			.pipe($.parker())
			.pipe(gulp.dest(config.dest + '/assets/toolkit/styles'));
});

// default build task
gulp.task('default', ['clean'], function () {

	// define build tasks
	var tasks = [
		'styles',
		'scripts',
		'scriptsShame',
		'images',
		'assemble'
	];

	// run build
	runSequence(tasks, function () {
		if (config.dev) {
			gulp.start('serve');
		}
	});

});
