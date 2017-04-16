"use strict";

var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var run = require('gulp-run');
var map = require('map-stream')
const exec = require('child_process').exec;


// Render an object from svg file to png
//
// Example: 
// svgToPng('./src/bitmap/apps/demo.svg','./Plane/bitmap/apps/48/demo.png','icon-32')
//
// inkscape more info -> https://inkscape.org/es/doc/inkscape-man.html


/**
 * Render the object from a SVG file to PNG in a path
 *
 * @param      {string}  FILE_FROM  The file from (?/xx.svg)
 * @param      {string}  FILE_TO    The file to PNG (?/xx.png)
 * @param      {string}  OBJECT_ID  The object id (icon-32)
 */
function svgToPng(FILE_FROM, FILE_TO, OBJECT_ID) {
    var renderSVG = `inkscape --export-id=${OBJECT_ID} --export-id-only --export-png=${FILE_TO} ${FILE_FROM}`;
    exec(renderSVG, (err, stdout, stderr) => {

        if (err) return err

        // console.log(`render: ${stdout}`);
        console.log(`Render: ${FILE_TO}`)

        return true
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
function renderIcon(FILE_PATH) {
    var FILE_NAME = path.basename(FILE_PATH, '.svg'),
        FILE_DIR = path.dirname(FILE_PATH).split(__dirname + '/src/').pop();

    // Only svg files
    if (path.extname(FILE_PATH) != '.svg') return

    // Obtein all objects from svg icon
    var GET_OBJECTS_ICON = new Promise(function(resolve, reject) {

        var OBJECTS_ICON = 'inkscape -S ' + FILE_PATH;

        exec(OBJECTS_ICON, (err, stdout, stderr) => {

            if (err) reject(err);
            if (stderr) reject(stderr);

            // string to array
            var toarray = stdout.split('\n');

            // filter all items with an icon object
            var arrayOnlyIcons = toarray.filter(i => i.includes('icon-'))

            resolve(arrayOnlyIcons);
        });

    })

    GET_OBJECTS_ICON.then(function(OBJECTS) {


        OBJECTS.map((OBJECT) => {

            var item_name = OBJECT.split(',')[0];
            var item_size = item_name.replace('icon-','');
            var item_to = `./${FILE_DIR}/${item_size}/${FILE_NAME}.png`
            var dir_to = `./${FILE_DIR}/${item_size}`

            // Create directory
            exec(`mkdir -p ${dir_to}`, (err, stdout, stderr) => {
                
                if (err) console.log(err);
                if (stderr) console.log(stderr);
                
                svgToPng(FILE_PATH,item_to,item_name)
            })
            
        })

    }, function(err) {

        console.log(err)

    })

}


/**
 * Start tasks
 */
gulp.task('default', function() {
    gulp.src('./src/**/*')
        .pipe(map(function(file, callback) {

            // Only render files
            // if (fs.statSync(file.path).isFile()){

                // Only svg files
                if (fs.statSync(file.path).isFile() &&  (path.extname(file.path) == '.svg')){
                    renderIcon(file.path);
                    callback(null, null)
                }   

            // }

            callback(null, file)

        }))
        .pipe(gulp.dest(__dirname))
});