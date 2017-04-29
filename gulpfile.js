"use strict";

const fs 	= require('fs'),
	path 	= require('path'),
	gulp 	= require('gulp'),
	map		= require('map-stream'),
	exec	= require('child_process').exec,
	watch 	= require('gulp-watch'),
	svg = require("svg"),
	gfile = require('gulp-file'),
	data = require('gulp-data'),
	fm = require('front-matter');

var mit = require('./mygulp.js')
 
// https://www.npmjs.com/package/gulp-edit-xml
/*==========================================
=            Clean directories            =
==========================================*/
gulp.task('clean', function(cb) {
	// Clean directories
	exec('rm -R ./plane ./plane-dark /usr/share/icons/plane /usr/share/icons/plane-dark && mkdir ./plane ./plane-dark', (err, stdout, stderr) => {
		cb(null)
	});
})


/*==========================================
=            Create icons                  =
==========================================*/
gulp.task('createIcon', ['clean'], function(cb) {


	gulp.src('./src/**/*')
		.pipe(mit('txt'))
		.pipe(gulp.dest(__dirname))
		.on('end', cb);
	


		// .pipe(map(function(file, next) {

		// 	if(path.extname(file.path) == '.svg'){
		// 		console.log(file)

		// 		// console.log(elem)
				
		// 		// next(null, file);
		// 		// next(null, file)
		// 		// console.log('nex')
		// 		// next(null, file)
				
		// 		// gfile('demo.js', file, { src: true }).pipe(gulp.dest('dist'));

		// 		// file.path = '/home/felipe/Proyectos/plane-icon-theme/z/plane-dark/apps/template.svg';
		// 		// next(null, file)

		// 		next();
		// 	}else{

		// 		next(null, file)
		// 	}



		// }))
		// .pipe(data(function(file){
		// 	if(path.extname(file.path) == '.svg'){
		// 		var content = fm(String(file.contents));
		// 		console.log(content)

		// 	}
		// }))
		// .pipe(gulp.dest(__dirname))
		// .on('end', cb);

})




/*===========================================
=            Gulpt default start            =
===========================================*/
gulp.task('default', ['createIcon'], function() {

});