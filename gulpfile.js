var gulp = require('gulp');
var amdOptimize = require('gulp-amd-optimizer');
var concat = require('gulp-concat');
var amdClean = require('gulp-amdclean');
var Karma = require('karma').Server;

var requireConfig = {
  baseUrl: __dirname + '/src/'
};

var options = {
  umd: true
};

function runKarma(watch, done) {
  new Karma({
    configFile: __dirname + '/tests/karma.conf.js',
    singleRun: watch
  }, done).start();
}

gulp.task('bundle', function () {
  return gulp.src('src/opentok-textchat.js')
    .pipe(amdOptimize(requireConfig, options))
    .pipe(concat('opentok-textchat.js'))
    .pipe(amdClean.gulp())
    .pipe(gulp.dest('dist'));
});

gulp.task('test', function (done) {
  runKarma(false, done);
});

gulp.task('tdd', function (done) {
  runKarma(true, done);
});

gulp.task('dist', ['test', 'bundle']);

gulp.task('default', ['tdd']);
