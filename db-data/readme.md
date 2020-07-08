# DB Open Data

Open data from [Deutsche Bahn](https://data.deutschebahn.com/) of stations, *Betriebsstellen* and  railway routes.

The data is used to match the [UIC station codes](https://www.wikidata.org/wiki/Property:P722) of trips with [railway route numbers](https://en.wikipedia.org/wiki/German_railway_route_numbers), function *findRailwayRoutesOfTrip* in [db-data.ts](../src/lib/db-data.ts).

### Station

* contains UIC station code and *Betriebsstelle*([DS100}(https://de.wikipedia.org/wiki/Betriebsstelle)) of station
* file: Datei D_Bahnhof_2020_alle.json
* source: https://data.deutschebahn.com/dataset/data-haltestellen

### Betriebsstellenverzeichnis

* contains all *Betriebsstellen*(DS100), every station is a *Betriebsstelle*
* file: DBNetz-Betriebsstellenverzeichnis-Stand2018-04.json
* source: https://data.deutschebahn.com/dataset/data-betriebsstellen

### Railway routes

* contains number and name of railway routes
* file: strecken.json
source: https://data.deutschebahn.com/dataset/geo-strecke

### Geoinformation of Betriebsstellen

* contains *Betriebsstelle*(DS100), railway route number and rail line kilometers
* file: betriebsstellen_open_data.json
* source: https://data.deutschebahn.com/dataset/geo-betriebsstelle

### Geoinformation of Betriebsstellen and Railway route endpoints

* extends file betriebsstellen_open_data.json with missing information of railway route endpoints
* file: betriebsstellen_streckennummer.json
* generrated by script [extend-geo-information.ts](../scripts/extend-geo-information.ts)

### Railway routes cache

* contains precomputed matchings of two station trips and the corresponding railway route numbers
* file: RailwayRouteCache.json
* generrated by script [create-cache.ts](../scripts/create-cache.ts)