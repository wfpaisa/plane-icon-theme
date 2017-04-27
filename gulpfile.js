"use strict";

var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var map = require('map-stream')
const exec = require('child_process').exec;

/**
 * Render the object from a SVG file to PNG in a path
 * 
 * https://inkscape.org/es/doc/inkscape-man.html
 *
 * @param      {string}  FILE_FROM  The file from (?/xx.svg)
 * @param      {string}  PNG_NAME    The file to PNG (?/xx.png)
 * @param      {string}  OBJECT_ID  The object id (icon-32)
 */
function svgToPng(filePath, objectId, pngName, cb) {

	let renderSVG = `inkscape --export-id=${objectId} --export-id-only --export-png=${pngName} "${filePath}" --export-area-snap`;
	
	exec(renderSVG, (err, stdout, stderr) => {

		if (err) return cb(err);

		console.log(`Render: ${pngName}`)

		cb();
	});
}



/**
 * Create all possible folder sizes from id name from svg file
 *
 * @param      {obj}       objects   A object with all name ids {icon:64}
 * @param      {string}    filePath  The file path
 * @return     {Function}  callback
 */
function createSizeFolder(objects, filePath, cb) {

	let count = Object.keys(objects).length;


	// Loop async of create directories
	function loopasync(cbLoop) {

		// Directory where is the svg file.
		let fileDir = path.dirname(filePath).split(__dirname + '/src/').pop();

		for (const key in objects) {

			let dirSizeTo 	= `./${fileDir}/${objects[key]}`,
				fileName 	= path.basename(filePath, '.svg'),
				pngName 	= key === 'icon' ? `./${fileDir}/${objects[key]}/${fileName}.png` : `./${fileDir}/${objects[key]}/${key}.png`,
				objectId 	= `${key}_${objects[key]}`;

			// Create directory
			exec(`mkdir -p ${dirSizeTo}`, (err, stdout, stderr) => {

				if (err) return cbLoop(err);
				if (stderr) return cbLoop(stderr);


				svgToPng(filePath, objectId, pngName, function(err) {
					if (err) return cbLoop(err);
					cbLoop();
				})

			})

		}

	}

	// Check all async
	loopasync(function(err) {

		if (err) return cb(err);

		// total of objects
		count--;

		// When it is equal to 0 is because all callbacks have returned
		if (count === 0) cb();
	})


}



/**
 * Gets all objects in a .svg file.
 *
 * @param      {string}    filePath  path svg file
 * @param      {Function}  cb        callback
 * @return     {err}       The object in svg.
 */
function getObjInSvg(filePath, cb) {

	// Only svg files
	if (path.extname(filePath) != '.svg') return cb();

	var svgFile = `inkscape -S "${filePath}"`;

	// Get all objects from svg file
	exec(svgFile, (err, stdout, stderr) => {

		if (err) cb(err);
		if (stderr) cb(stderr);

		var re = /\n(.{2,})_([0-9]{2,}),/g,
			matches = {};

		stdout.replace(re, (match, $1, $2) => {
			matches[$1] = $2
		});


		// to create folder sizes
		createSizeFolder(matches, filePath, function(err) {
			if (err) return cb(err);
			cb();
		})


	});

}




/**
 * From SVG file path
 * 0. Check if is svg file.
 * 1. Read the file.
 * 2. Extract the all objects that start with 'icon-' to array
 * 3. Create folders for each object of array
 * 4. Render the object to png file
 *
 * @param      {string}  FILE_PATH  The file path (?/xx.svg)
 */
function renderIcon(FILE_PATH, cb) {


	var FILE_NAME = path.basename(FILE_PATH, '.svg'),
		FILE_DIR = path.dirname(FILE_PATH).split(__dirname + '/src/').pop();

	// Only svg files
	if (path.extname(FILE_PATH) != '.svg') return cb

	// Obtein all objects from svg icon
	var GET_OBJECTS_ICON = new Promise(function(resolve, reject) {

		var OBJECTS_ICON = `inkscape -S "${FILE_PATH}"`;

		// Get all objects from svg file
		exec(OBJECTS_ICON, (err, stdout, stderr) => {

			if (err) reject(err);
			if (stderr) reject(stderr);

			var re = /\n(.{2,})_([0-9]{2,}),/g,
				matches = {};

			stdout.replace(re, (match, $1, $2) => {
				matches[$1] = $2
			});

			resolve(matches);
		});

	})

	GET_OBJECTS_ICON.then(function(OBJECTS) {


		for (const KEY in OBJECTS) {

			var PNG_NAME = KEY === 'icon' ? `./${FILE_DIR}/${OBJECTS[KEY]}/${FILE_NAME}.png` : `./${FILE_DIR}/${OBJECTS[KEY]}/${KEY}.png`,
				DIR_TO = `./${FILE_DIR}/${OBJECTS[KEY]}`,
				OBJECT_ID = `${KEY}_${OBJECTS[KEY]}`;


			createFolder(FILE_PATH, PNG_NAME, DIR_TO, OBJECT_ID, function(err) {
				if (err) return cb(err);

				cb()
			});

		}

		cb(null, OBJECTS);

	}, function(err) {

		cb(err)

	})

}


/*==========================================
=            Remove directories            =
==========================================*/
gulp.task('clean', function(cb) {
	// Clean directories
	exec('rm -R ./plane ./plane-dark && mkdir ./plane ./plane-dark', (err, stdout, stderr) => {
		cb(null)
	});
})


/*==========================================
=            Create icons                  =
==========================================*/
gulp.task('createIcon', ['clean'], function(cb) {


	gulp.src('./src/**/*')
		.pipe(map(function(file, callback) {

			// Only svg files
			if (fs.statSync(file.path).isFile() && (path.extname(file.path) == '.svg')) {

				// // Render icons
				// renderIcon(file.path,function(err){
				//     if(err) return cb(err)

				//     callback();
				// });

				// Start process to create icons
				getObjInSvg(file.path, function(err) {
					if (err) return callback(err)

					callback();
				})

				// No copy svg file
			} else {
				callback(null, file);
			}
		}))
		.pipe(gulp.dest(__dirname))
		.on('end', cb);



})


/*==========================================
=            Copy directories            =
==========================================*/
gulp.task('copy', ['createIcon'], function(cb) {
	// Clean directories
	// exec('cp -R ./plane /usr/share/icons/plane && cp -R ./plane-dark /usr/share/icons/plane-dark ',(err,stdout,stderr)=>{


	//     if (err) console.log(err);
	//     if (stderr) console.log(stderr);

	//     console.log('-------Copy--------')
	//     cb(null)
	// });
	cb(null);
})


/*===========================================
=            Gulpt default start            =
===========================================*/
gulp.task('default', ['copy'], function() {

});