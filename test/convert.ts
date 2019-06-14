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

function destPath(metalsmith: Metalsmith, ...paths: string[]): string {
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
        done(null, files, metalsmith);
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

function assertFileConverted({
    t,
    metalsmith,
    sourceFilename,
    destFilename,
    destFileContents,
}: {
    t: ExecutionContext;
    metalsmith: Metalsmith;
    sourceFilename?: string;
    destFilename: string;
    destFileContents: string;
}): Promise<void> {
    return new Promise(resolve => {
        metalsmith.build(err => {
            t.is(err, null, 'No build error');

            assertFileContentsEquals(
                t,
                destPath(metalsmith, destFilename),
                destFileContents,
            )
                .then(() => {
                    if (sourceFilename && sourceFilename !== destFilename) {
                        return assertFileNotExists(
                            t,
                            destPath(metalsmith, sourceFilename),
                        );
                    }
                    return undefined;
                })
                .then(() => {
                    resolve();
                });
        });
    });
}

function assertFileNotConverted({
    t,
    metalsmith,
    sourceFilename,
    destFilename,
}: {
    t: ExecutionContext;
    metalsmith: Metalsmith;
    sourceFilename: string;
    destFilename: string;
}): Promise<void> {
    return new Promise(resolve => {
        metalsmith.build(err => {
            t.is(err, null, 'No build error');

            assertFileNotExists(t, destPath(metalsmith, destFilename))
                .then(() =>
                    assertFileExists(t, destPath(metalsmith, sourceFilename)),
                )
                .then(() => {
                    resolve();
                });
        });
    });
}

test.serial('should render html', async t => {
    const metalsmith = createMetalsmith().use(pugConvert());
    await assertFileConverted({
        t,
        metalsmith,
        sourceFilename: 'index.pug',
        destFilename: 'index.html',
        destFileContents: '<h1>Hello World</h1>',
    });
});

test.serial('should not support .jade files by default', async t => {
    const metalsmith = createMetalsmith().use(pugConvert());
    await assertFileNotConverted({
        t,
        metalsmith,
        sourceFilename: 'legacy.jade',
        destFilename: 'legacy.html',
    });
});

test.serial('should support .jade files by pattern options', async t => {
    const metalsmith = createMetalsmith().use(
        pugConvert({
            pattern: '**/*.jade',
        }),
    );
    await assertFileConverted({
        t,
        metalsmith,
        sourceFilename: 'legacy.jade',
        destFilename: 'legacy.html',
        destFileContents: '<h1>Hello World</h1>',
    });
});

test.serial('should render without changing the file name', async t => {
    const metalsmith = createMetalsmith().use(
        pugConvert({
            renamer: filename => filename,
        }),
    );
    await assertFileConverted({
        t,
        metalsmith,
        sourceFilename: 'index.pug',
        destFilename: 'index.pug',
        destFileContents: '<h1>Hello World</h1>',
    });
});

test.serial('should render html with locals', async t => {
    const metalsmith = createMetalsmith().use(
        pugConvert({
            locals: {
                A: 1,
                B: 2,
                E: 42,
            },
        }),
    );
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'locals.html',
        destFileContents: 'A:1 B:2 E:42 ',
    });
});

test.serial('should render html with locals only', async t => {
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
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'locals.html',
        destFileContents: 'M_L_O:options L_O:options M_O:options ',
    });
});

test.serial('should render html with locals and metadata', async t => {
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
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'locals.html',
        destFileContents: 'M_L_O:locals M_L:locals L_O:locals M_O:metadata ',
    });
});

test.serial('should render html with includes', async t => {
    const metalsmith = createMetalsmith()
        .source('includes')
        .use(pugConvert());

    await assertFileConverted({
        t,
        metalsmith,
        sourceFilename: 'index.pug',
        destFilename: 'index.html',
        destFileContents: '<h1>Hello World</h1><h2>hoge</h2>',
    });
});

test.serial('should pass options to pug', async t => {
    const metalsmith = createMetalsmith().use(
        pugConvert({
            doctype: 'xml',
        }),
    );

    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'self-closing.html',
        destFileContents: '<br></br>',
    });
});
