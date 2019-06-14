import fs from 'fs';
import path from 'path';
import test, { ExecutionContext } from 'ava';
import Metalsmith from 'metalsmith';
import pug from 'pug';
import sinon from 'sinon';

import convert, { compile, render } from '../src';
import { isObject } from '../src/utils';

function objIgnoreKeys<T>(obj: T, keyList: string[]): T {
    if (isObject(obj)) {
        // @ts-ignore: TS2322
        const newObj: T = {};
        return Object.entries(obj)
            .filter(([key]) => !keyList.includes(key))
            .reduce((obj, [key, value]) => {
                // @ts-ignore: TS7053
                obj[key] = value;
                return obj;
            }, newObj);
    }
    return obj;
}

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

function assertMetalsmithBuild({
    t,
    metalsmith,
}: {
    t: ExecutionContext;
    metalsmith: Metalsmith;
}): Promise<void> {
    return new Promise(resolve => {
        metalsmith.build(err => {
            t.is(err, null, 'No build error');
            resolve();
        });
    });
}

async function assertFileConverted({
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
    await assertMetalsmithBuild({
        t,
        metalsmith,
    });
    await assertFileContentsEquals(
        t,
        destPath(metalsmith, destFilename),
        destFileContents,
    );
    if (sourceFilename && sourceFilename !== destFilename) {
        await assertFileNotExists(t, destPath(metalsmith, sourceFilename));
    }
}

async function assertFileNotConverted({
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
    await assertMetalsmithBuild({
        t,
        metalsmith,
    });
    await assertFileNotExists(t, destPath(metalsmith, destFilename));
    await assertFileExists(t, destPath(metalsmith, sourceFilename));
}

function assertFilesPlugin(
    t: ExecutionContext,
    fileNameList: string[],
    message?: string,
): Metalsmith.Plugin {
    return (files, metalsmith, done) => {
        t.deepEqual(Object.keys(files).sort(), fileNameList.sort(), message);
        done(null, files, metalsmith);
    };
}

test.serial('should render html: convert()', async t => {
    const metalsmith = createMetalsmith().use(convert());
    await assertFileConverted({
        t,
        metalsmith,
        sourceFilename: 'index.pug',
        destFilename: 'index.html',
        destFileContents: '<h1>Hello World</h1>',
    });
});

test.serial('should render html: compile() & render()', async t => {
    const metalsmith = createMetalsmith()
        .use(compile())
        .use(render());
    await assertFileConverted({
        t,
        metalsmith,
        sourceFilename: 'index.pug',
        destFilename: 'index.html',
        destFileContents: '<h1>Hello World</h1>',
    });
});

test.serial('should render html with lazy evaluation', async t => {
    const metalsmith = createMetalsmith()
        .use(
            assertFilesPlugin(
                t,
                [
                    'index.html',
                    'index.pug',
                    'legacy.jade',
                    'locals.pug',
                    'self-closing.pug',
                ],
                'Before compile',
            ),
        )
        .use(compile())
        .use(
            assertFilesPlugin(
                t,
                [
                    'index.html',
                    'legacy.jade',
                    'locals.html',
                    'self-closing.html',
                ],
                'After compile & Before render',
            ),
        )
        .use(render())
        .use(
            assertFilesPlugin(
                t,
                [
                    'index.html',
                    'legacy.jade',
                    'locals.html',
                    'self-closing.html',
                ],
                'After render',
            ),
        );
    await assertMetalsmithBuild({
        t,
        metalsmith,
    });
});

test.serial('should not overwrite duplicate files: convert()', async t => {
    const metalsmith = createMetalsmith().use(
        convert({
            overwrite: false,
        }),
    );
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'index.html',
        destFileContents: '<img>\n',
    });
});

test.serial(
    'should not overwrite duplicate files: compile() & render()',
    async t => {
        const metalsmith = createMetalsmith()
            .use(
                compile({
                    overwrite: false,
                }),
            )
            .use(render());
        await assertFileConverted({
            t,
            metalsmith,
            destFilename: 'index.html',
            destFileContents: '<img>\n',
        });
    },
);

test.serial('should not support .jade files by default: convert()', async t => {
    const metalsmith = createMetalsmith().use(convert());
    await assertFileNotConverted({
        t,
        metalsmith,
        sourceFilename: 'legacy.jade',
        destFilename: 'legacy.html',
    });
});

test.serial(
    'should not support .jade files by default: compile() & render()',
    async t => {
        const metalsmith = createMetalsmith()
            .use(compile())
            .use(render());
        await assertFileNotConverted({
            t,
            metalsmith,
            sourceFilename: 'legacy.jade',
            destFilename: 'legacy.html',
        });
    },
);

test.serial(
    'should support .jade files by pattern options: convert()',
    async t => {
        const metalsmith = createMetalsmith().use(
            convert({
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
    },
);

test.serial(
    'should support .jade files by pattern options: compile() & render()',
    async t => {
        const metalsmith = createMetalsmith()
            .use(
                compile({
                    pattern: '**/*.jade',
                }),
            )
            .use(render());
        await assertFileConverted({
            t,
            metalsmith,
            sourceFilename: 'legacy.jade',
            destFilename: 'legacy.html',
            destFileContents: '<h1>Hello World</h1>',
        });
    },
);

test.serial(
    'should render without changing the file name: convert()',
    async t => {
        const metalsmith = createMetalsmith().use(
            convert({
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
    },
);

test.serial(
    'should render without changing the file name: compile() & render()',
    async t => {
        const metalsmith = createMetalsmith()
            .use(
                compile({
                    renamer: filename => filename,
                }),
            )
            .use(render());
        await assertFileConverted({
            t,
            metalsmith,
            sourceFilename: 'index.pug',
            destFilename: 'index.pug',
            destFileContents: '<h1>Hello World</h1>',
        });
    },
);

test.serial('should render html with locals: convert()', async t => {
    const metalsmith = createMetalsmith().use(
        convert({
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

test.serial('should render html with locals: compile() & render()', async t => {
    const metalsmith = createMetalsmith()
        .use(compile())
        .use(
            render({
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

test.serial('should render html with locals only: convert()', async t => {
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
            convert({
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

test.serial(
    'should render html with locals only: compile() & render()',
    async t => {
        const metalsmith = createMetalsmith()
            .metadata({
                M_L_O: 'metadata',
                M_L: 'metadata',
                M_O: 'metadata',
            })
            .use(compile())
            .use(
                setLocalsPlugin({
                    M_L_O: 'locals',
                    M_L: 'locals',
                    L_O: 'locals',
                }),
            )
            .use(
                render({
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
    },
);

test.serial(
    'should render html with locals and metadata: convert()',
    async t => {
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
                convert({
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
            destFileContents:
                'M_L_O:locals M_L:locals L_O:locals M_O:metadata ',
        });
    },
);

test.serial(
    'should render html with locals and metadata: compile() & render()',
    async t => {
        const metalsmith = createMetalsmith()
            .metadata({
                M_L_O: 'metadata',
                M_L: 'metadata',
                M_O: 'metadata',
            })
            .use(compile())
            .use(
                setLocalsPlugin({
                    M_L_O: 'locals',
                    M_L: 'locals',
                    L_O: 'locals',
                }),
            )
            .use(
                render({
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
            destFileContents:
                'M_L_O:locals M_L:locals L_O:locals M_O:metadata ',
        });
    },
);

test.serial('should render html with includes: convert()', async t => {
    const metalsmith = createMetalsmith()
        .source('includes')
        .use(convert());

    await assertFileConverted({
        t,
        metalsmith,
        sourceFilename: 'index.pug',
        destFilename: 'index.html',
        destFileContents: '<h1>Hello World</h1><h2>hoge</h2>',
    });
});

test.serial(
    'should render html with includes: compile() & render()',
    async t => {
        const metalsmith = createMetalsmith()
            .source('includes')
            .use(compile())
            .use(render());

        await assertFileConverted({
            t,
            metalsmith,
            sourceFilename: 'index.pug',
            destFilename: 'index.html',
            destFileContents: '<h1>Hello World</h1><h2>hoge</h2>',
        });
    },
);

test.serial('should pass options to pug: convert()', async t => {
    const metalsmith = createMetalsmith().use(
        convert({
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

test.serial('should pass options to pug: compile() & render()', async t => {
    const metalsmith = createMetalsmith()
        .use(
            compile({
                doctype: 'xml',
            }),
        )
        .use(render());

    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'self-closing.html',
        destFileContents: '<br></br>',
    });
});

test.serial('Validate options passed to Pug API: convert()', async t => {
    const spy = sinon.spy(pug, 'compile');

    const compileOptions = {
        ...convert.defaultOptions,
        doctype: 'xml',
        cache: false,
        another: 10,
        hoge: 'fuga',
        x: 42,
    };
    const metalsmith = createMetalsmith().use(convert(compileOptions));
    await assertMetalsmithBuild({
        t,
        metalsmith,
    });

    spy.args.forEach(([, pugOptions]) => {
        t.deepEqual(
            objIgnoreKeys(pugOptions, ['filename']),
            objIgnoreKeys(compileOptions, Object.keys(convert.defaultOptions)),
            "Pug's options do not include convert.defaultOptions",
        );
    });

    spy.restore();
});

test.serial(
    'Validate options passed to Pug API: compile() & render()',
    async t => {
        const spy = sinon.spy(pug, 'compile');

        const compileOptions = {
            ...convert.defaultOptions,
            doctype: 'xml',
            cache: false,
            another: 10,
            hoge: 'fuga',
            x: 42,
        };
        const metalsmith = createMetalsmith().use(compile(compileOptions));
        await assertMetalsmithBuild({
            t,
            metalsmith,
        });

        spy.args.forEach(([, pugOptions]) => {
            t.deepEqual(
                objIgnoreKeys(pugOptions, ['filename']),
                objIgnoreKeys(
                    compileOptions,
                    Object.keys(compile.defaultOptions),
                ),
                "Pug's options do not include compile.defaultOptions",
            );
        });

        spy.restore();
    },
);
