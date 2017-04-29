var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

// Consts
const PLUGIN_NAME = 'gulp-prefixer';

function prefixStream(prefixText) {
  var stream = through();
  console.log('pasa aca')
  // console.log(stream.read())
  // stream.write(prefixText);
  return stream;
}

// Plugin level function(dealing with files)
function gulpPrefixer(prefixText) {

  console.log(prefixText)

  // if (!prefixText) {
  //   throw new PluginError(PLUGIN_NAME, 'Missing prefix text!');
  // }

  prefixText = new Buffer(prefixText); // allocate ahead of time

  // Creating a stream through which each file will pass
  return through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      // return empty file
      return cb(null, file);
    }
    if (file.isBuffer()) {
      file.contents = Buffer.concat([prefixText, file.contents]);
      console.log('is bufer: ',file.contents)
    }
    if (file.isStream()) {
      file.contents = file.contents.pipe(prefixStream(prefixText));
      console.log('is stream: ',file.path)
    }

    cb(null, file);

  });

}

// Exporting the plugin main function
module.exports = gulpPrefixer;