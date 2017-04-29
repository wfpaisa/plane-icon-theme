"use strict";

const fs 	= require('fs'),
	path 	= require('path'),
	gulp 	= require('gulp'),
	map		= require('map-stream'),
	exec	= require('child_process').exec,
	watch 	= require('gulp-watch');


/**
 * Render the object from a SVG file to PNG in a path
 * https://inkscape.org/es/doc/inkscape-man.html
 *
 * @param      {string}    filePath  path svg file
 * @param      {string}    objectId  Name of object in svg file: folder_128
 * @param      {string}    pngName   Path with name to render file icon: app/128/folder.png
 * @param      {Function}  cb        callback
 */
function svgToPng(filePath, objectId, pngName, cb) {

	let renderSVG = `inkscape --export-id=${objectId} --export-id-only --export-png="${pngName}" "${filePath}"`;
	
	exec(renderSVG, (err, stdout, stderr) => {

		if (err) return cb(err);

		console.log("\x1b[32m", `${filePath} => ${pngName}`)

		cb();
	});
}



/**
 * Create all possible folder sizes from id name from svg file
 *
 * @param      {Array}     Array   A array with all names and sizes [{key:'icon', size:'64'}]
 * @param      {string}    filePath  The file path
 * @param      {Function}  cb        callback
 * @return     {err}       If is err.
 */
function createSizeFolder(arrayIds, filePath, cb) {

	let count = arrayIds.length;


	// Loop async of create directories
	function loopasync(cbLoop) {

		// Directory where is the svg file.
		let fileDir = path.dirname(filePath).split(__dirname + '/src/').pop();

		for (const item of arrayIds) {

			let dirSizeTo 	= `./${fileDir}/${item.size}`,
				fileName 	= path.basename(filePath, '.svg'),
				pngName 	= item.key === 'icon' ? `./${fileDir}/${item.size}/${fileName}.png` : `./${fileDir}/${item.size}/${item.key}.png`,
				objectId 	= `${item.key}_${item.size}`;

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

		// total of arrayIds
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
			matches = [];
		
		stdout.replace(re, (match, $1, $2) => {
			matches.push({key:$1,size:$2});
		});

		//
		if(matches[0]){
			// to create folder sizes
			createSizeFolder(matches, filePath, function(err) {
				if (err) return cb(err);
				cb();
			})
			
		}else{
			let dirTO = filePath.split(__dirname + '/src/').pop();
			console.log('\x1b[33m%s\x1b[0m: ',` ${filePath} -> ./${dirTO}`)
			cb(null,filePath);
		}



	});

}




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
		.pipe(map(function(file, callback) {

			// Only svg files
			if (fs.statSync(file.path).isFile() && (path.extname(file.path) == '.svg')) {


				// Start process to create icons
				getObjInSvg(file.path, function(err, resolve) {
					if (err) return callback(err)

					// If (resolve) not have objects, then  will copy the original file
					if (resolve) return callback(null, file);

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
=            Link directories            =
==========================================*/
gulp.task('link', function(cb) {
	// Clean directories
	exec('rm -R /usr/share/icons/plane /usr/share/icons/plane-dark', (err, stdout, stderr) => {
		// exec('cp -R ./plane /usr/share/icons/plane && cp -R ./plane-dark /usr/share/icons/plane-dark ',(err,stdout,stderr)=>{
		exec(`ln -s ${__dirname}/plane /usr/share/icons/plane && ln -s ${__dirname}/plane-dark /usr/share/icons/plane-dark`,(err,stdout,stderr)=>{

		    if (err) return cb(err);
		    if (stderr) return cb(stderr);
		    
		    cb();
		});
	});
})


/*==========================================
=            Copy directories            =
==========================================*/
gulp.task('copy', function(cb) {
	exec('rm -R /usr/share/icons/plane /usr/share/icons/plane-dark', (err, stdout, stderr) => {
		exec('cp -R ./plane /usr/share/icons/plane && cp -R ./plane-dark /usr/share/icons/plane-dark ',(err,stdout,stderr)=>{

		    if (err) return cb(err);
		    if (stderr) return cb(stderr);
		    
		    cb();
		});
	});
})


/*==========================================
=            Watch files            =
==========================================*/
gulp.task('watch', function () {

	return watch('./src/**/*', function (file) {

		// Check if file exist 
		if(!fs.existsSync(file.path)){
			console.log('remove ->', file.path)
			return
		}

		// Only svg files
		if (fs.statSync(file.path).isFile() && (path.extname(file.path) == '.svg')) {

			// Start process to create icons
			getObjInSvg(file.path, function(err) {
				
				if (err) console.log(err)
				
				// Update icons
				let lasta = process.argv[process.argv.length - 1];
				
				if(lasta == '-P' || lasta == '-D' ){
					
					if(lasta == '-P') lasta = 'plane';
					if(lasta == '-D') lasta = 'plane-dark';

					exec('gsettings set org.gnome.desktop.interface icon-theme "Adwaita"',()=>{
						
						setTimeout(()=>{
							
							exec(`gsettings set org.gnome.desktop.interface icon-theme "${lasta}"`,()=>{
								setTimeout(()=>{
									exec(`gtk-update-icon-cache -f -t /usr/share/icons/${lasta}`,()=>{
										console.log(`Update ${lasta} icons`)
									})
								},2000)
							})
							
						},2000)

					})

				}

	
			})
		} 

	});
});



/*===========================================
=            Gulpt default start            =
===========================================*/
gulp.task('default', ['createIcon'], function() {

});