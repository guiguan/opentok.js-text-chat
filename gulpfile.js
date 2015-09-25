var gulp = require('gulp');
var amdOptimize = require('gulp-amd-optimizer');
var concat = require('gulp-concat');
var amdClean = require('gulp-amdclean');

var requireConfig = {
  baseUrl: __dirname + '/src/'
};
var options = {
  umd: true
};

gulp.task('default', function () {
  return gulp.src('src/opentok-textchat.js')
    .pipe(amdOptimize(requireConfig, options))
    .pipe(concat('opentok-textchat.js'))
    .pipe(amdClean.gulp())
    .pipe(gulp.dest('dist'));
});
