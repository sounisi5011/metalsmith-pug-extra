import fs from 'fs';
import path from 'path';
import test from 'ava';
import Metalsmith from 'metalsmith';
import pugConvert from '../src';

function createMetalsmith(): Metalsmith {
    return Metalsmith(path.join(__dirname, 'fixtures'))
        .source('pages')
        .destination('build')
        .clean(true);
}

function destPath(metalsmith, ...paths): string {
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

            metalsmith.build(err => {
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

test.serial(
    'should not support .jade files by default',
    t =>
        new Promise(resolve => {
            const metalsmith = createMetalsmith().use(pugConvert());

            metalsmith.build(err => {
                t.is(err, null, 'No build error');

                fs.readFile(destPath(metalsmith, 'legacy.html'), err => {
                    t.truthy(err, 'File does not exist');

                    resolve();
                });
            });
        }),
);

test.serial(
    'should support .jade files by pattern options',
    t =>
        new Promise(resolve => {
            const metalsmith = createMetalsmith().use(
                pugConvert({
                    pattern: '**/*.jade',
                }),
            );

            metalsmith.build(err => {
                t.is(err, null, 'No build error');

                fs.readFile(
                    destPath(metalsmith, 'legacy.html'),
                    (err, data) => {
                        t.falsy(err, 'No readFile error');

                        if (!err) {
                            t.is(data.toString(), '<h1>Hello World</h1>');
                        }

                        resolve();
                    },
                );
            });
        }),
);
