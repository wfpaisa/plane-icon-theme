# Plane icon theme

A simple iconset, preferably used in dark versions of Gnome.  Love/Arch/Inkscape/Gnome


- Source icons in = ./src/plane ./src/plane-dark

- Render icons in = ./plane ./plane-dark


## Installation

1. Downlad the lasted version in [releases](https://github.com/wfpaisa/plane-icon-theme/releases)
2. Unzip
3. White
	- Copy in `./plane` to `/usr/share/icons/plane/`
4. Dark
	- Copy in `./plane-dark` to `/usr/share/icons/plane-dark`
5. Change icon set with Gnome Tweak Tool


## Build

- Is necesary nodejs 7.0 +
- `$ npm install`
- `$ npm install --global gulp-cli`
- `$ gulp`
- `sudo gulp copy`

## Developer

Allows hot editing, gulp watch auto will generate the icon and if you pass the parameter will update the icon set.

```bash 

# Symbolic link /usr/share/icons/ -> ./plane && ./plane-dark
$ sudo gulp link


# Auto update
$ gulp watch 

# Or auto update with refresh icon cache Light (plane) version
$ gulp watch -P 

# Or auto update with refresh icon cache Dark (plane-dark) version
$ gulp watch -D 
```
Generate png files `renamegulpfile-to-png.js` to `gulpfile.js`.


### Estructure file
`templates/*` contain it the templates with the structure, all templates should have the this structure:

[tag] => inkscape layer
```
folder.svg
	[icon_16|desktop_scalable] -> Render: 16/folder.svg or scalable/desktop.svg 
		[icon]
			"icon content"
		[frame]"contain only a rectangle with sizes of the icon"
			[frame_16] "must be Rectangle, Render icon with this sizes"
```

- *.svg* properties are: units in `px`, the `scale in x="1.000"` `scale in y="1.000"`, `viewbox x:0, y:0`
- The script get all layers the first level and render them Individually



![Screen](./screenshot.png)



## Thanks to

- (Breeze)[https://github.com/KDE/breeze-icons]
- (Arc Icon Theme)[https://github.com/fc8855/arc-icons]
- (Paper Icon Theme)[https://github.com/snwh/paper-icon-theme]

And all those designs that served as inspiration



License: GPLv3