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

function setLocalsPlugin(locals: {
    [index: string]: unknown;
}): Metalsmith.Plugin {
    return (files, metalsmith, done) => {
        Object.values(files).forEach(file => {
            Object.assign(file, locals);
        });
        done();
    };
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

test.serial(
    'should render html with locals',
    t =>
        new Promise(resolve => {
            const metalsmith = createMetalsmith().use(
                pugConvert({
                    locals: {
                        A: 1,
                        B: 2,
                        E: 42,
                    },
                }),
            );

            metalsmith.build(err => {
                t.is(err, null, 'No build error');

                assertFileContentsEquals(
                    t,
                    destPath(metalsmith, 'locals.html'),
                    'A:1 B:2 E:42 ',
                ).then(() => {
                    resolve();
                });
            });
        }),
);

test.serial(
    'should render html with locals only',
    t =>
        new Promise(resolve => {
            const metalsmith = createMetalsmith()
                .metadata({
                    M_L_O: 'metadata',
                    M_L: 'metadata',
                    M_O: 'metadata',
                })
                .use(
                    setLocalsPlugin({
                        M_L_O: 'locals',
                        M_L: 'locals',
                        L_O: 'locals',
                    }),
                )
                .use(
                    pugConvert({
                        locals: {
                            M_L_O: 'options',
                            L_O: 'options',
                            M_O: 'options',
                        },
                    }),
                );

            metalsmith.build(err => {
                t.is(err, null, 'No build error');

                assertFileContentsEquals(
                    t,
                    destPath(metalsmith, 'locals.html'),
                    'M_L_O:options L_O:options M_O:options ',
                ).then(() => {
                    resolve();
                });
            });
        }),
);

test.serial(
    'should render html with locals and metadata',
    t =>
        new Promise(resolve => {
            const metalsmith = createMetalsmith()
                .metadata({
                    M_L_O: 'metadata',
                    M_L: 'metadata',
                    M_O: 'metadata',
                })
                .use(
                    setLocalsPlugin({
                        M_L_O: 'locals',
                        M_L: 'locals',
                        L_O: 'locals',
                    }),
                )
                .use(
                    pugConvert({
                        locals: {
                            M_L_O: 'options',
                            L_O: 'options',
                            M_O: 'options',
                        },
                        useMetadata: true,
                    }),
                );

            metalsmith.build(err => {
                t.is(err, null, 'No build error');

                assertFileContentsEquals(
                    t,
                    destPath(metalsmith, 'locals.html'),
                    'M_L_O:locals M_L:locals L_O:locals M_O:metadata ',
                ).then(() => {
                    resolve();
                });
            });
        }),
);

test.serial(
    'should render html with includes',
    t =>
        new Promise(resolve => {
            const metalsmith = createMetalsmith()
                .source('includes')
                .use(pugConvert());

            metalsmith.build(err => {
                t.is(err, null, 'No build error');

                assertFileContentsEquals(
                    t,
                    destPath(metalsmith, 'index.html'),
                    '<h1>Hello World</h1><h2>hoge</h2>',
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
    'should pass options to pug',
    t =>
        new Promise(resolve => {
            const metalsmith = createMetalsmith().use(
                pugConvert({
                    doctype: 'xml',
                }),
            );

            metalsmith.build(err => {
                t.is(err, null, 'No build error');

                assertFileContentsEquals(
                    t,
                    destPath(metalsmith, 'self-closing.html'),
                    '<br></br>',
                ).then(() => {
                    resolve();
                });
            });
        }),
);
