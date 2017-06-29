/**
 * 	Plane icon theme
 *	Copyright (C) 2017  wfpaisa
 *
 *	This program is free software: you can redistribute it and/or modify
 *	it under the terms of the GNU General Public License as published by
 *	the Free Software Foundation, either version 3 of the License, or
 *	(at your option) any later version.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU General Public License for more details.
 *
 *	You should have received a copy of the GNU General Public License
 *	along with this program.  If not, see <https://www.gnu.org/licenses/gpl-3.0.en.html>.
 *
 * @author    @wfpaisa
 * @copyright 2017 Plane icon theme
 */

"use strict";
var fs = require('fs'),
	path = require('path'),
	gulp = require('gulp'),
	through2 = require('through2'),
	File = require('vinyl'),
	del = require('del'),
	xml2js = require('xml2js'),
	svgo = require('gulp-svgo'),
	exec = require('child_process').exec,
	watch = require('gulp-watch');



/**
 * Scan all groups from svg file and return a array of icons
 *
 * @param      {stream}    file    The file
 * @param      {Function}  cb      { err,[] } return a array of icons
 */
function renderIcons(file, cb) {

	try {

		let xml = file.contents.toString('utf8');

		// Are there icon inside file?
		var findIcon = false;


		xml2js.parseString(xml, (err, xmlObj) => {

			if (err) return cb(err);

			// let layers = result.svg;

			// Are there layers?
			if (!xmlObj.svg.g) return cb(null, []);

			let allIcons = [];

			// Get layers
			xmlObj.svg.g.forEach(layer => {

				// Are there groups?
				if (!layer.g) return;

				// Check if is visible
				if (layer.$.style && (layer.$.style === 'display:none')) return;


				/*==================================================
				=          1. Separe icon (inmutable)            =
				==================================================*/

				let icon = JSON.parse(JSON.stringify(xmlObj)),
					builder = new xml2js.Builder();


				// Replace all groups for current group
				icon.svg.g = [layer];


				/*=============================================
				=         2. Name and Size the icon           =
				*
				* Set new size from layer name_size
				=============================================*/
				let haveName = false;

				layer.$["inkscape:label"].replace(/(.{2,})_([0-9]{1,}|scalable)/, (match, $1, $2) => {

					icon.svg.$.folder = $2;

					if ($1 == 'icon') {
						icon.svg.$['sodipodi:docname'] = path.basename(file.path);
					} else {
						icon.svg.$['sodipodi:docname'] = `${$1}.svg`;
					}

					// Find a name
					haveName = true;
				});
				if(!haveName) return console.log("\x1b[31m", `Layer(${layer.$['inkscape:label']}) The name must be: "name_size", example: icon_24" or "atom_24".`);


				/*===================================================================================
				=       3. Move the layer to x=0 y=0  and check if have layer with name=frame       =
				====================================================================================*/
				let haveFrame = false;
				let rectx = 0;
				let recty = 0;

				// Check if there are a group with label iframe and if this have a rectangle
				layer.g.forEach(frame => {
					if ((frame.$['inkscape:label'] === 'frame') && frame.rect) {

						// File sizes
						icon.svg.$.width = frame.rect[0].$.width;
						icon.svg.$.height = frame.rect[0].$.height;
						icon.svg.$.viewBox = `0 0 ${frame.rect[0].$.width} ${frame.rect[0].$.height}`;


						// Translate this elemento to position 0x 0y
						let gx = -1 * frame.rect[0].$.x;
						let gy = -1 * frame.rect[0].$.y;
						icon.svg.g[0].$.transform = `translate(${gx},${gy})`;						

						haveFrame = true;

					}
				})

				if (!haveFrame) return console.log("\x1b[31m", `Layer(${layer.$['inkscape:label']}) Has to have a layer with the name "frame" and inside this a rectangle with the measures of the icon.`);



				/*========================================
				=         4. JSON -> xml(svg)            =
				========================================*/
				let strToXml = builder.buildObject(icon);
				let fileDir = path.dirname(file.path);
				// Complete path of icon size/name_id.svg
				let filePath = `${fileDir}/${icon.svg.$.folder}/${icon.svg.$['sodipodi:docname']}`;



				/*==========================================================
				=    5. Create stream icon and push icon to gulp stream    =
				==========================================================*/
				let newIcon = new File({
					base: file.base,
					path: filePath,
					contents: new Buffer(strToXml)
				});

				allIcons.push(newIcon)


			});


			// Test, no render
			// return cb(null, [])

			cb(null, allIcons);
		})


	} catch (err) {

		console.error("\x1b[31m", 'Error in: ' + file.path);
		return cb(err, [])

	}

}




/*================================================
=            Prepare for export icons            =
================================================*/


/**
 * Prepare for export icons
 *
 * @return     {stream}  return a gulp stream
 */
function svg_icons_export() {


	return through2.obj(function(file, enc, next) {

		// Only svg files
		if (path.extname(file.path) != '.svg') return next(null, file);


		console.log("\x1b[32m", `├─${file.path}`)

		// If icon is in size-folder or scalable folder return
		if (file.path.match('\/scalable\/.*\.svg|\/[0-9]{2,}\/.*\.svg')) return next(null, file)

		// Render Icons
		renderIcons(file, (err, icons) => {

			if (err) return next(err);


			if (!icons[0]) return next(null, file)


			// through2.this.push new icon
			icons.forEach(icon => {


				console.log("\x1b[32m", `│ ├─>${icon.path}`)
				this.push(icon);
			})
			console.log(' │')

			next();
		})

	});


}


/*==========================================
=            Copy directories            =
==========================================*/
gulp.task('copy-plane', (cb) => {
	del(['/usr/share/icons/plane/'], {
		force: true
	}).then(paths => {
		gulp.src(['./plane/**/*'])
			.pipe(svgo())
			.pipe(gulp.dest('/usr/share/icons/plane/'))
			.on('end', cb)
	});
})


gulp.task('copy-plane-dark', (cb) => {
	del(['/usr/share/icons/plane-dark/'], {
		force: true
	}).then(paths => {
		gulp.src(['./plane-dark/**/*'])
			.pipe(svgo())
			.pipe(gulp.dest('/usr/share/icons/plane-dark/'))
			.on('end', cb)
	});
})

gulp.task('copy', ['copy-plane', 'copy-plane-dark'], (cb) => {
	cb();
})


/*==========================================
=            Clean directories            =
==========================================*/
gulp.task('clean', (cb) => {
	del(['./plane/**/*', './plane-dark/**/*']).then(paths => {
		// console.log('Deleted files and folders:\n', paths.join('\n'));
		cb()
	});
})

/*==========================================
=            Watch files            =
==========================================*/
gulp.task('watch', function(cb) {

	// for compare the date of modified of the file
	var rere = '';	

	return watch('./src/**/*', function(file) {
		
		// console.log("\x1b[0m", file.path);

		// when delete file
		if (!fs.existsSync(file.path)) return;

		var dir = path.dirname(file.path);
		var dirTo = dir.replace('src/', '');
		

		// Time for write big files
		// Avoid the error: no writecb in Transform class
		setTimeout(function(){

			// Modified date
			var fStatMtime = String(fs.statSync(file.path).mtime) + file.path; 
			
			
			// Sometimes the same file is passed twice, by means of the modification date control that will be rendered only once
			if(rere !== fStatMtime){
				rere = fStatMtime;
				// console.log("\x1b[0m");


				gulp.src(file.path)
					.pipe(svg_icons_export())
					.pipe(gulp.dest(dirTo))
					.on('end', (cb) => {


						// Update cache icons
						if (process.argv[process.argv.length - 1]) {

							let lasta = process.argv[process.argv.length - 1];

							if (lasta != "-P" && lasta != "-D") return;

							if (lasta == '-P') lasta = 'plane';
							if (lasta == '-D') lasta = 'plane-dark';

							// exec('gsettings set org.gnome.desktop.interface icon-theme "Adwaita"', () => {

							// 	setTimeout(() => {

							// 		exec(`gsettings set org.gnome.desktop.interface icon-theme "${lasta}"`, () => {
							// 			setTimeout(() => {
											exec(`gtk-update-icon-cache -f -t /usr/share/icons/${lasta}`, () => {
												console.log(`Update ${lasta} icons`)
												

											})
									// 	}, 2000)
									// })

								// }, 2000)

							// })

						}
					});

			}// if
		
		}, 2000)//settimeout



	});
});

/*==========================================
=            Link directories            =
==========================================*/
gulp.task('link', function(cb) {
	// Clean directories
	del(['/usr/share/icons/plane', '/usr/share/icons/plane-dark'], {
		force: true
	}).then(paths => {

		exec(`ln -s ${__dirname}/plane /usr/share/icons/plane && ln -s ${__dirname}/plane-dark /usr/share/icons/plane-dark`, (err, stdout, stderr) => {

			if (err) return cb(err);
			if (stderr) return cb(stderr);

			cb();
		});

	});

})


/*====================================
=           .Render icons.           =
====================================*/
gulp.task('default', ['clean'], (cb) => {
	gulp.src('./src/**/*')
		.pipe(svg_icons_export())
		.pipe(gulp.dest(__dirname))
		.on('end', cb);
});