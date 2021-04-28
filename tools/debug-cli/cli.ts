
import { hafas } from "./hafas";

require('isomorphic-fetch');

const myArgs = process.argv.slice(2);

const profile = myArgs.indexOf("--fshafas") > 0 ? 'db-fsharp' : 'db';

const client = hafas(profile);

const locations = () => {
    client.locations('Hannover', 1)
        .then(result => {
            result.forEach(s => {
                if (client.isStop(s)) {
                    console.log(s.id, s.name);
                }
            });
        })
        .catch(console.error);
}

const journeys = () => {
    client.journeys('Osnabrück', 'Hannover', 3)
        .then(result => {
            result.forEach(j => {
                j.legs.forEach(l => {
                    console.log('leg: ', l.origin?.name, l.destination?.name, l.line?.product, l.line?.fahrtNr, l.plannedDeparture)
                });
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
    default:
        console.log('unkown argument: ', myArgs[0]);
}
