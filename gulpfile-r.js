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

			// layer.g
			layer.g.forEach(group => {


				console.log(group)
				/*==================================================
				=          1. Separe icon (inmutable)            =
				==================================================*/

				let icon = JSON.parse(JSON.stringify(xmlObj)),
					builder = new xml2js.Builder();

				// Rewrite layers and groups with current layer and group
				icon.svg.g = [{
					$: layer.$,
					g: [group]
				}];


				/*=============================================
				=         2. Name and Size the icon           =
				*
				* Set new size from group name_size
				* if name is diferent to 'icon' change
				=============================================*/
				group.$.id.replace(/(.{2,})_([0-9]{2,})/, (match, $1, $2) => {
					icon.svg.$.width = $2;
					icon.svg.$.height = $2;
					icon.svg.$.viewBox = `0 0 ${$2} ${$2}`;


					if ($1 == 'icon') {
						icon.svg.$['sodipodi:docname'] = path.basename(file.path);
					} else {
						icon.svg.$['sodipodi:docname'] = `${$1}.svg`;
					}

					// Find a icon
					findIcon = true;
				});



				/*=======================================================
				=            3. Get x,y from rect.id="iframe"           =
				*
				* This rectangle have the absolute position
				=======================================================*/
				let rectx = 0;
				let recty = 0;
				let frameExist = false;

				if (group.rect) {
					group.rect.forEach((rect) => {

						if (rect.$['inkscape:label'] == 'frame') {
							rectx = rect.$.x;
							recty = rect.$.y;
							frameExist = true;
						}
					})
				}



				/*====================================================
				=            4. Translate group x:0 , y:0            =
				* Real position = (-Rect.x) * (group.zoom-width)
				* move the matrix or translate transform
				====================================================*/
				if (frameExist) {

					// Remove layer transform 
					if (layer.$.transform) delete icon.svg.g[0].$.transform;

					// Translate group to absolute position
					if (group.$.transform) {

						if (group.$.transform.match(/translate/)) {

							let gx = -1 * rectx;
							let gy = -1 * recty;
							icon.svg.g[0].g[0].$.transform = `translate(${gx},${gy})`;

						} else {

							let reg = /matrix\(([e|\-|0-9|\.]*),([e|\-|0-9|\.]*),([e|\-|0-9|\.]*),([e|\-|0-9|\.]*),([e|\-|0-9|\.]*),([e|\-|0-9|\.]*)\)/;
							let strG = icon.svg.g[0].g[0].$.transform;

							strG.replace(reg, (match, $1, $2, $3, $4, $5, $6) => {
								let gx = -($1) * rectx;
								let gy = -($4) * recty;

								icon.svg.g[0].g[0].$.transform = `matrix(${$1},${$2},${$3},${$4},${gx},${gy})`;

							})

						}
					} else {

						let gx = -1 * rectx;
						let gy = -1 * recty;
						icon.svg.g[0].g[0].$.transform = `translate(${gx},${gy})`;

					}
				}



				// JSON -> xml(svg)
				let strToXml = builder.buildObject(icon);
				let fileDir = path.dirname(file.path);
				// Complete path of icon size/name_id.svg
				let filePath = `${fileDir}/${icon.svg.$.width}/${icon.svg.$['sodipodi:docname']}`;


				// Create new file from icon
				let newIcon = new File({
					base: file.base,
					path: filePath,
					contents: new Buffer(strToXml)
				});

				// Add icon
				allIcons.push(newIcon)

			})
		})

		// Test, no render
		//return cb(null, [])

		// if there is no icon inside the file
		if (!findIcon) return cb(null, [file])

		cb(null, allIcons);
	})

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

	return watch('./src/**/*', function(file) {

		console.log(file.path)
		var dir = path.dirname(file.path);
		var dirTo = dir.replace('src/', '');


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

					exec('gsettings set org.gnome.desktop.interface icon-theme "Adwaita"', () => {

						setTimeout(() => {

							exec(`gsettings set org.gnome.desktop.interface icon-theme "${lasta}"`, () => {
								setTimeout(() => {
									exec(`gtk-update-icon-cache -f -t /usr/share/icons/${lasta}`, () => {
										console.log(`Update ${lasta} icons`)
									})
								}, 2000)
							})

						}, 2000)

					})

				}
			});


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
=            Render icons            =
====================================*/
gulp.task('default', ['clean'], (cb) => {
	gulp.src('./src/**/*')
		.pipe(svg_icons_export())
		.pipe(gulp.dest(__dirname))
		.on('end', cb);
});