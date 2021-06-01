import { hafas } from "../../src/lib//hafas";
import { Line } from 'hafas-client';

require('isomorphic-fetch');

const myArgs = process.argv.slice(2);

const profile = myArgs.indexOf("--fshafas") > 0 ? 'db-fsharp' : 'db';

const client = hafas(profile);

const locations = () => {
    client.locations('Minden', 1)
        .then(result => {
            result.forEach(s => {
                if (client.isStop(s)) {
                    console.log(s.id, s.name);
                }
                console.log(s);
            });
        })
        .catch(console.error);
}

const filterLines = (lines?: readonly Line[]): string[] => {
    return lines
        ? lines?.filter(l => l.name && l.mode === 'train' && !l.name?.startsWith('Bus') && !l.name?.startsWith('S')).map(l => l.name ?? '')
        : [];
}

const journeys = () => {
    client.journeys('Bünde', 'Hamburg', 3, undefined, 'Hannover')
        .then(result => {
            result.forEach(j => {
                console.log('price: ', j.price);
                j.legs.forEach(l => {
                    console.log('leg: ', l.tripId, l.origin?.name, l.destination?.name, l.line?.name, l.line?.product, l.line?.fahrtNr, l.plannedDeparture)

                    if (l.tripId
                        // && l.tripId === '1|321004|0|80|20052021'
                    ) {
                        client.tripOfLeg(l.tripId, l.origin, l.destination, l.polyline)
                            .then(trip => {
                                console.log('leg: ', l.tripId, l.origin?.name, l.destination?.name, l.line?.name, l.line?.product, l.line?.fahrtNr, l.plannedDeparture)
                                trip.stopovers?.forEach(so => {
                                    console.log('stop: ', so.stop?.name, so.stop?.location?.latitude, so.stop?.location?.longitude, so.stop?.distance?.toFixed(3), ' lines:', filterLines(so.stop?.lines).length);
                                })
                            })
                            .catch((error) => {
                                console.log('There has been a problem with your tripsOfJourney operation: ' + error);
                            });
                    }

                });
                /*
                const ji = client.journeyInfo(j);
                if (ji.lineNames.includes('ICE')) {
                    client.stopssOfJourney(ji, ['train'], true, false)
                        .then(stops => {
                            console.log('journey:', ji.origin?.name, ji.destination?.name, ji.plannedDeparture, ji.lineNames)
                            stops.forEach(s => {
                                console.log('stop: ', s.name, s.location?.latitude, s.location?.longitude);
                            });
                        }).catch(console.error);
                }
                */
            });
        })
        .catch(console.error);
}

const nearby = () => {
    client.nearby(52.202139, 8.57383, 20000, ["train"], { nationalExpress: true, national: true, regionalExp: true, regional: true })
        .then(result => {
            console.log('found:', result.length)
            result.forEach(s => {
                if (client.isStop(s)) {
                    console.log('stop: ', s.name, s.location?.latitude, s.location?.longitude);
                    filterLines(s.lines).forEach(name => console.log('  ', name));
                }
            });
        })
        .catch(console.error);
}

switch (myArgs[0]) {
    case 'locations':
        locations();
        break;
    case 'journeys':
        journeys();
        break;
    case 'nearby':
        nearby();
        break;
    default:
        console.log('unkown argument: ', myArgs[0]);
}
