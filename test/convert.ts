import fs from 'fs';
import path from 'path';
import test, { ExecutionContext } from 'ava';
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

function assertFileExists(
    t: ExecutionContext,
    filepath: string,
): Promise<void> {
    return new Promise(resolve => {
        fs.stat(filepath, err => {
            t.falsy(err, 'File exist');
            resolve();
        });
    });
}

function assertFileNotExists(
    t: ExecutionContext,
    filepath: string,
): Promise<void> {
    return new Promise(resolve => {
        fs.stat(filepath, err => {
            t.truthy(err, 'File does not exist');
            resolve();
        });
    });
}

function assertFileContentsEquals(
    t: ExecutionContext,
    filepath: string,
    contents: string,
): Promise<void> {
    return new Promise(resolve => {
        fs.readFile(filepath, (err, data) => {
            t.falsy(err, 'No readFile error');

            if (!err) {
                t.is(data.toString(), contents, filepath);
            }

            resolve();
        });
    });
}

test.serial(
    'should render html',
    t =>
        new Promise(resolve => {
            const metalsmith = createMetalsmith().use(pugConvert());

            metalsmith.build(err => {
                t.is(err, null, 'No build error');

                assertFileContentsEquals(
                    t,
                    destPath(metalsmith, 'index.html'),
                    '<h1>Hello World</h1>',
                )
                    .then(() =>
                        assertFileNotExists(
                            t,
                            destPath(metalsmith, 'index.pug'),
                        ),
                    )
                    .then(() => {
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

                assertFileNotExists(t, destPath(metalsmith, 'legacy.html'))
                    .then(() =>
                        assertFileExists(
                            t,
                            destPath(metalsmith, 'legacy.jade'),
                        ),
                    )
                    .then(() => {
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

                assertFileContentsEquals(
                    t,
                    destPath(metalsmith, 'legacy.html'),
                    '<h1>Hello World</h1>',
                )
                    .then(() =>
                        assertFileNotExists(
                            t,
                            destPath(metalsmith, 'legacy.jade'),
                        ),
                    )
                    .then(() => {
                        resolve();
                    });
            });
        }),
);

test.serial(
    'should render without changing the file name',
    t =>
        new Promise(resolve => {
            const metalsmith = createMetalsmith().use(
                pugConvert({
                    renamer: filename => filename,
                }),
            );

            metalsmith.build(err => {
                t.is(err, null, 'No build error');

                assertFileContentsEquals(
                    t,
                    destPath(metalsmith, 'index.pug'),
                    '<h1>Hello World</h1>',
                ).then(() => {
                    resolve();
                });
            });
        }),
);
