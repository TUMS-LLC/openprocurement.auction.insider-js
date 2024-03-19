const gulp = require('gulp'),
  notify = require('gulp-notify'),
  del = require('del'),
  concat = require('gulp-concat'),
  minify = require('gulp-minify'),
  cleanCSS = require('gulp-clean-css'),
  uglify = require('gulp-uglify'),
  fs = require('fs'),
  less = require('gulp-less'),
  eslint = require('gulp-eslint'),
  lessAutoprefix = require('less-plugin-autoprefix'),
  sourcemaps = require('gulp-sourcemaps'),
  render = require('gulp-nunjucks-render'),
  data = require('gulp-data'),
  rev = require('gulp-rev'),
  revReplace = require('gulp-rev-replace'),
  revdel = require('gulp-rev-delete-original');

function interceptErrors(error) {
  let args = Array.prototype.slice.call(arguments);
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>'
  }).apply(this, args);
  this.emit('end');
}

const config = JSON.parse(fs.readFileSync('./config.json'));
const devel = ('devel' in config) ? config.devel : true;

gulp.task('base:all', () => {
  return gulp.src(config.assets).pipe(gulp.dest(config.buildDir));
});

gulp.task('js:vendor', () => {
  return gulp.src(config.js)
    .pipe(sourcemaps.init())
    .pipe(concat('vendor.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.buildDir + '/static/js'));
});

gulp.task('js:tenders', () => {
  return gulp.src(config.modules.tenders.js)
    .pipe(sourcemaps.init())
    .pipe(concat('insider.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.buildDir + '/static/js'));
});

gulp.task('js:lint', () => {
  return gulp.src(config.modules.tenders.js)
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task('css:all', () => {
  let autoprefix = new lessAutoprefix({ browsers: ['last 2 versions'] });
  return gulp.src(config.styles)
    .pipe(concat('all.less'))
    .pipe(less({
      plugins: [autoprefix]
    }))
    .on('error', interceptErrors)
    .pipe(cleanCSS({ compatibility: 'ie11' }))
    .pipe(gulp.dest(config.buildDir + '/static/css'));
});

gulp.task('html:all', () => {
  return gulp.src('templates/*.html')
    .pipe(render({
      path: 'templates/',
      data: config,
    }))
    .pipe(gulp.dest(config.buildDir));
});

gulp.task('revision', ['base:all', 'js:vendor', 'js:tenders', 'css:all', 'html:all'], function() {
  return gulp.src([config.buildDir + '/**/*.css', config.buildDir + '/**/*.js'])
    .pipe(rev())
    .pipe(gulp.dest(config.buildDir))
    .pipe(revdel())
    .pipe(rev.manifest())
    .pipe(gulp.dest(config.buildDir));
});

gulp.task('revreplace', ['revision'], function() {
  let manifest = gulp.src(config.buildDir + '/rev-manifest.json');
  return gulp.src(config.buildDir + '/*.html')
    .pipe(revReplace({ manifest: manifest }))
    .pipe(gulp.dest(config.buildDir));
});

gulp.task('build', ['revreplace'], () => {
  return gulp.src(config.buildDir + '/**/*.*')
    .pipe(gulp.dest(config.outDir));
});

gulp.task('build:buildout', ['clean', 'build'], () => {
  return gulp.src(config.outDir + '/**/*.*')
    .pipe(gulp.dest(config.buildout_outDir));
});

gulp.task('default', ['build']);

gulp.task('clean', function() {
  del.sync([config.buildDir + '*/**', config.outDir + '*/**'], { force: true });
});