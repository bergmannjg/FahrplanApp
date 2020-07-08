# FahplanApp

Android App to get timetable information for public transportation in germany and europe,

* build with [React Native](https://reactnative.dev/),
* supported languages: German and English,
* uses [hafas-client](https://github.com/public-transport/hafas-client) for timetable information,
* routes will be shown in a map with [brouter web client](https://brouter.de/brouter-web),
* provides a way to get the rail line kilometers, see discussion [here](https://bahnreise-wiki.de/wiki/Entfernungskilometer_ermitteln),
* uses [open data](./db-data/readme.md) from Deutsche Bahn to match journeys with railway route numbers, this provides a further way to get the rail line kilometers.

## Installation

* install packages: `npm install`
* compile: `tsc`
* run tests: `npm test`
* install on device: `npm run android-release -- --deviceId <id of device>`

## Notes

* to use the hafas-client package the international variant of JavaScriptCore is needed (see jscFlavor in file build.gradle).
* to build and debug under WSL2 (Windows subsystem for linux), see [here](https://gist.github.com/bergmannjg/461958db03c6ae41a66d264ae6504ade).
