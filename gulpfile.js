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
 * @copyright 2018 Plane icon theme
 */

"use strict";

const version = '1.9';
const variants = [
	['Plane','Gnome'],
	['Plane','Dark','Gnomedark'],

	['Plane','Gnome', 'Arch'],
	['Plane','Dark','Gnomedark', 'Archdark'],

	['Plane','Gnome', 'Magenta'],
	['Plane','Dark','Gnomedark', 'Magentadark'],

	['Plane','Gnome', 'Manjaro'],
	['Plane','Dark','Gnomedark', 'Manjarodark'],

	['Plane','Gnome', 'Ubuntu'],
	['Plane','Dark','Gnomedark', 'Ubuntudark'],

	// ['Plane','Kde'],
	// ['Plane','Dark','Kdedark']
];

var fs = require('fs'),
	path = require('path'),
	gulp = require('gulp'),
	through2 = require('through2'),
	File = require('vinyl'),
	del = require('del'),
	xml2js = require('xml2js'),
	svgmin = require('gulp-svgmin'),
	exec = require('child_process').exec,
	watch = require('gulp-watch'),
	foreach = require("gulp-foreach"),
	zip = require("gulp-zip");


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

		if(process.argv[process.argv.length - 1] == '-debug'){
			console.log("\x1b[32m", `├─${file.path}`)
		}

		// If icon is in size-folder or scalable folder return
		if (file.path.match('\/scalable\/.*\.svg|\/[0-9]{2,}\/.*\.svg')) return next(null, file)
		// Render Icons
		renderIcons(file, (err, icons) => {

			if (err) return next(err);


			if (!icons[0]) return next(null, file)


			// through2.this.push new icon
			icons.forEach(icon => {

				

				if(process.argv[process.argv.length - 1] == '-debug'){
					console.log("\x1b[32m", `│ ├─>${icon.path}`)
				}else{
					process.stdout.write(".");
				}

				this.push(icon);
			})
 
			if(process.argv[process.argv.length - 1] == '-debug'){
				console.log(' │')
			}

			next();
		})

	});


}



/*==========================================
=            Watch files            =
==========================================*/
gulp.task('watch', function(cb) {

	// for compare the date of modified of the file
	var rere = '';

	return watch('./src/variants/**/*', function(file) {

		// console.log("\x1b[0m", file.path);

		// when delete file
		if (!fs.existsSync(file.path)) return;

		let iconSet = 'PlaneGnome';

		if(process.argv[process.argv.length - 1]){
			iconSet = process.argv[process.argv.length - 1].replace('-', '');
		}

		var dir = path.dirname(file.path);
		var dirTo = dir.replace(/src\/variants\/(.*?)\//, `build/variants/${iconSet}/`);

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
					// .pipe(svgmin({
					// 	js2svg: {
					// 		pretty: true
					// 	}
					// }))
					.pipe(gulp.dest(dirTo))
					.on('end', (cb) => {

						exec(`gtk-update-icon-cache -f -t ~/.local/share/icons/${iconSet}`, () => {
							console.log("\x1b[32m", `✔ Update ${iconSet} set icon`);
						})

					});

			}// if

		}, 2000)//settimeout


	});
});



/*==============================
=            Render            =
==============================*/

gulp.task('default', (cb)=>{
	
	// Clean folders
	new Promise( (resolve, reject) =>{
		del(['./.tmp', './build']).then(paths => {

			console.log("\x1b[32m", "✔ Clean");
			resolve()
		});
	})

	// Prepare temp files
	.then( (ret) => {
		return new Promise( (resolve, reject) => {
			gulp.src([
				'./src/**/*.*',
				'!./src/variants/**/*.svg'
				])
				.pipe(gulp.dest(__dirname + '/.tmp'))
				.on('end', (cb) => {
					
					console.log("\x1b[32m", "✔ Prepare temp files");
					resolve()
				})
		});
	})

	// Render icons
	.then( (ret) => {

		console.log("\x1b[33m", "» Render icons (This may take some time)");

		return new Promise( (resolve, reject) => {
			gulp.src('./src/variants/**/*.svg')
				.pipe(svg_icons_export())
				// Opcional, minimize
				.pipe(svgmin())
				.pipe(gulp.dest(__dirname + '/.tmp/variants/'))
				.on('end', (cb) =>{

					console.log("\x1b[32m", "✔ Render icons");
					resolve();
				});
		});
		
	})

	// Make set icons
	.then( (ret) => {
		return new Promise( (resolve, reject) => {

			// 3 Synchronous, copy every folder in each array of variants
			function copyFolder(folderFrom, folderTo){
				return new Promise( (resolve) => {
					gulp.src(`./.tmp/variants/${folderFrom}/**/*`)
						.pipe(gulp.dest(__dirname + '/build/variants/' + folderTo))
						.on('end', (cb) =>{
							resolve();
						});
				});
			}

			// 2 Make a mix of foldes from each item of variants
			async function mixFolder(folderArray){

				var folderTo = '';
				folderArray.map( (f) => { folderTo += f })

				for (const folderFrom of folderArray){
					await copyFolder(folderFrom, folderTo)
				}
				console.log("\x1b[32m", `✔ Build ${folderTo} icon set`);
			}

			// 1 Go through each variants
			async function arrayVariants(variants){

				for(const  arrayFolder of variants){
					await mixFolder(arrayFolder);
				}

				resolve();
			}

			arrayVariants(variants)
			
		});
		
	})

	// Copy others files
	.then( (ret) => {
		return new Promise( (resolve, reject) => {
			gulp.src([
				'./.tmp/**/*',
				'!./.tmp/variants/',
				'!./.tmp/variants/**/*',
				])
				.pipe(gulp.dest(__dirname + '/build/'))
				.on('end', (cb) =>{

					console.log("\x1b[32m", "✔ Copy others files");
					resolve();
				});
		});
	})

	// Zip files
	.then( (ret) => {

		return new Promise( (resolve, reject) => {
			

			gulp.src("./build/variants/*")
				.pipe( foreach( function(stream, file){
					
					var fileName = file.path.substr(file.path.lastIndexOf("/")+1);
					// console.log(` - ${fileName}`);

					return gulp.src(`./build/variants/${fileName}/**/*`)
						.pipe(zip(`${fileName}-${version}.zip`))
				}))
				.pipe(gulp.dest('./build/zip-variants'))
				.on('end', (cb)=>{
					console.log("\x1b[32m", "✔ Zip icon set");
					resolve();
				})
				
		})

	})

	// fin
	.then( (msgEnd) => {
		console.log("\x1b[32m", `✔ Ready`);
		cb()
	}).

	// Erros
	catch( (err) =>{
		if(err) return console.log('Error: ' + err);
	});


});


/**

	TODO:
	Temporales:

	Build
	1. pasar a build todo 
	1. Copiar todos los archivos que no esten en Variantes
	2. Combinar todas las variantes segun el array


	- Minify and clear files too with https://github.com/scour-project/scour
	- Multiple folder colors
	- Compress each set-icons


 */
