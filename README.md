# Plane-icon-theme

A simple iconset, preferably used in dark versions of Gnome.  Love/Arch


- Source icons in = ./src/plane ./src/plane-dark

- Render icons in = ./plane ./plane-dark


## Installation

1. Downlad the lasted version in [releases](https://github.com/wfpaisa/plane-icon-theme/releases)
2. Unzip
3. Copy in `/usr/share/icons/plane/` or `/usr/share/icons/plane-dark/`
4. Change icon set with Gnome Tweak Tool


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


![Screen](./screenshot.png)



## TODO
- change clean exec to gulp-del

## Recursos
- (jsdom)[https://www.smashingmagazine.com/2014/05/love-generating-svg-javascript-move-to-server/#jsdom]
- (svgutils)[https://github.com/Goomeo/svgutils]

License: GPLv3