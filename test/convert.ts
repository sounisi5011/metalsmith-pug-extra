import fs from 'fs';
import path from 'path';
import test from 'ava';
import Metalsmith from 'metalsmith';
import pugConvert from '../src';

function createMetalsmith() {
    return Metalsmith(path.join(__dirname, 'fixtures'))
        .source('pages')
        .destination('build')
        .clean(true);
}

function destPath(metalsmith, ...paths) {
    return path.join(
        path.relative(process.cwd(), metalsmith.destination()),
        ...paths,
    );
}

test.serial(
    'should render html',
    t =>
        new Promise(resolve => {
            const metalsmith = createMetalsmith().use(pugConvert());

            metalsmith.build((err, files) => {
                t.is(err, null, 'No build error');

                fs.readFile(destPath(metalsmith, 'index.html'), (err, data) => {
                    t.falsy(err, 'No readFile error');

                    if (!err) {
                        t.is(data.toString(), '<h1>Hello World</h1>');
                    }

                    resolve();
                });
            });
        }),
);
