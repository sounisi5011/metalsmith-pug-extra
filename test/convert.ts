import test, { ExecutionContext } from 'ava';
import fs from 'fs';
import cloneDeep from 'lodash.clonedeep';
import Metalsmith from 'metalsmith';
import path from 'path';
import pug from 'pug';
import sinon from 'sinon';
import slug from 'slug';
import util from 'util';

import { compile, convert, render } from '../src';
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

const destDirSet = new Set();
function getDestDir(t: ExecutionContext): string {
    const dirName = slug(t.title, slug.defaults.modes['rfc3986']);
    if (destDirSet.has(dirName)) {
        throw new Error(`Duplicate test dir: ${dirName}`);
    }
    destDirSet.add(dirName);
    return dirName;
}

function createMetalsmith(t: ExecutionContext): Metalsmith {
    return Metalsmith(path.join(__dirname, 'fixtures'))
        .source('pages')
        .destination(path.join('build', getDestDir(t)))
        .clean(true);
}

function destPath(metalsmith: Metalsmith, ...paths: string[]): string {
    return path.join(
        path.relative(process.cwd(), metalsmith.destination()),
        ...paths,
    );
}

async function readSourceFile(
    metalsmith: Metalsmith,
    filename: string,
): Promise<string> {
    const readFile = util.promisify(fs.readFile);
    const sourceFilepath = metalsmith.path(metalsmith.source(), filename);
    return (await readFile(sourceFilepath)).toString();
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

test('should render html: convert()', async t => {
    const metalsmith = createMetalsmith(t).use(convert());
    await assertFileConverted({
        t,
        metalsmith,
        sourceFilename: 'index.pug',
        destFilename: 'index.html',
        destFileContents: '<h1>Hello World</h1>',
    });
});

test('should render html: compile() & render()', async t => {
    const metalsmith = createMetalsmith(t)
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

test('should render html with lazy evaluation', async t => {
    const metalsmith = createMetalsmith(t)
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

/**
 * @see https://github.com/sounisi5011/metalsmith-pug-extra/issues/19
 */
test('should render html even if the contents change', async t => {
    const metalsmith = createMetalsmith(t)
        .use(compile())
        .use((files, metalsmith, done) => {
            Object.values(files).forEach(data => {
                data.contents = Buffer.from(data.contents.toString());
            });
            done(null, files, metalsmith);
        })
        .use(render());
    await assertFileConverted({
        t,
        metalsmith,
        sourceFilename: 'index.pug',
        destFilename: 'index.html',
        destFileContents: '<h1>Hello World</h1>',
    });
});

test('should not overwrite duplicate files: convert()', async t => {
    const metalsmith = createMetalsmith(t).use(
        convert({
            overwrite: false,
        }),
    );
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'index.html',
        destFileContents: await readSourceFile(metalsmith, 'index.html'),
    });
});

test('should not overwrite duplicate files: compile() & render()', async t => {
    const metalsmith = createMetalsmith(t)
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
        destFileContents: await readSourceFile(metalsmith, 'index.html'),
    });
});

test('should not support .jade files by default: convert()', async t => {
    const metalsmith = createMetalsmith(t).use(convert());
    await assertFileNotConverted({
        t,
        metalsmith,
        sourceFilename: 'legacy.jade',
        destFilename: 'legacy.html',
    });
});

test('should not support .jade files by default: compile() & render()', async t => {
    const metalsmith = createMetalsmith(t)
        .use(compile())
        .use(render());
    await assertFileNotConverted({
        t,
        metalsmith,
        sourceFilename: 'legacy.jade',
        destFilename: 'legacy.html',
    });
});

test('should support .jade files by pattern options: convert()', async t => {
    const metalsmith = createMetalsmith(t).use(
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
});

test('should support .jade files by pattern options: compile() & render()', async t => {
    const metalsmith = createMetalsmith(t)
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
});

test('should render without changing the file name: convert()', async t => {
    const metalsmith = createMetalsmith(t).use(
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
});

test('should render without changing the file name: compile() & render()', async t => {
    const metalsmith = createMetalsmith(t)
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
});

test('should render html with locals: convert()', async t => {
    const metalsmith = createMetalsmith(t).use(
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

test('should render html with locals: compile() & render()', async t => {
    const metalsmith = createMetalsmith(t)
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

test('should render html with locals only: convert()', async t => {
    const metalsmith = createMetalsmith(t)
        .metadata({ A: 1 })
        .use(setLocalsPlugin({ B: 2 }))
        .use(
            convert({
                locals: { C: 3 },
                useMetadata: false,
            }),
        );
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'locals.html',
        destFileContents: 'C:3 ',
    });
});

test('should render html with locals only: compile() & render()', async t => {
    const metalsmith = createMetalsmith(t)
        .metadata({ A: 1 })
        .use(compile())
        .use(setLocalsPlugin({ B: 2 }))
        .use(
            render({
                locals: { C: 3 },
                useMetadata: false,
            }),
        );
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'locals.html',
        destFileContents: 'C:3 ',
    });
});

test('should render html with locals and metadata: convert()', async t => {
    const metalsmith = createMetalsmith(t)
        .metadata({ A: 1 })
        .use(setLocalsPlugin({ B: 2 }))
        .use(
            convert({
                locals: { C: 3 },
                useMetadata: true,
            }),
        );
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'locals.html',
        destFileContents: 'A:1 B:2 C:3 ',
    });
});

test('should render html with locals and metadata: compile() & render()', async t => {
    const metalsmith = createMetalsmith(t)
        .metadata({ A: 1 })
        .use(compile())
        .use(setLocalsPlugin({ B: 2 }))
        .use(
            render({
                locals: { C: 3 },
                useMetadata: true,
            }),
        );
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'locals.html',
        destFileContents: 'A:1 B:2 C:3 ',
    });
});

test('files[filename] needs to overwrite Metalsmith.metadata(): convert()', async t => {
    const metalsmith = createMetalsmith(t)
        .metadata({ A: 'Metalsmith.metadata()' })
        .use(setLocalsPlugin({ A: 'files[filename]' }))
        .use(convert({ useMetadata: true }));
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'locals.html',
        destFileContents: 'A:files[filename] ',
    });
});

test('files[filename] needs to overwrite Metalsmith.metadata(): compile() & render()', async t => {
    const metalsmith = createMetalsmith(t)
        .metadata({ A: 'Metalsmith.metadata()' })
        .use(compile())
        .use(setLocalsPlugin({ A: 'files[filename]' }))
        .use(render({ useMetadata: true }));
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'locals.html',
        destFileContents: 'A:files[filename] ',
    });
});

test('files[filename] needs to overwrite options.locals: convert()', async t => {
    const metalsmith = createMetalsmith(t)
        .use(setLocalsPlugin({ A: 'files[filename]' }))
        .use(convert({ locals: { A: 'options.locals' }, useMetadata: true }));
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'locals.html',
        destFileContents: 'A:files[filename] ',
    });
});

test('files[filename] needs to overwrite options.locals: compile() & render()', async t => {
    const metalsmith = createMetalsmith(t)
        .use(compile())
        .use(setLocalsPlugin({ A: 'files[filename]' }))
        .use(render({ locals: { A: 'options.locals' }, useMetadata: true }));
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'locals.html',
        destFileContents: 'A:files[filename] ',
    });
});

test('Metalsmith.metadata() needs to overwrite options.locals: convert()', async t => {
    const metalsmith = createMetalsmith(t)
        .metadata({ A: 'Metalsmith.metadata()' })
        .use(convert({ locals: { A: 'options.locals' }, useMetadata: true }));
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'locals.html',
        destFileContents: 'A:Metalsmith.metadata() ',
    });
});

test('Metalsmith.metadata() needs to overwrite options.locals: compile() & render()', async t => {
    const metalsmith = createMetalsmith(t)
        .metadata({ A: 'Metalsmith.metadata()' })
        .use(compile())
        .use(render({ locals: { A: 'options.locals' }, useMetadata: true }));
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'locals.html',
        destFileContents: 'A:Metalsmith.metadata() ',
    });
});

test('files[filename] needs to overwrite Metalsmith.metadata() and options.locals: convert()', async t => {
    const metalsmith = createMetalsmith(t)
        .metadata({ A: 'Metalsmith.metadata()' })
        .use(setLocalsPlugin({ A: 'files[filename]' }))
        .use(convert({ locals: { A: 'options.locals' }, useMetadata: true }));
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'locals.html',
        destFileContents: 'A:files[filename] ',
    });
});

test('files[filename] needs to overwrite Metalsmith.metadata() and options.locals: compile() & render()', async t => {
    const metalsmith = createMetalsmith(t)
        .metadata({ A: 'Metalsmith.metadata()' })
        .use(compile())
        .use(setLocalsPlugin({ A: 'files[filename]' }))
        .use(render({ locals: { A: 'options.locals' }, useMetadata: true }));
    await assertFileConverted({
        t,
        metalsmith,
        destFilename: 'locals.html',
        destFileContents: 'A:files[filename] ',
    });
});

test('should render html with includes: convert()', async t => {
    const metalsmith = createMetalsmith(t)
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

test('should render html with includes: compile() & render()', async t => {
    const metalsmith = createMetalsmith(t)
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
});

test('should pass options to pug: convert()', async t => {
    const metalsmith = createMetalsmith(t).use(
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

test('should pass options to pug: compile() & render()', async t => {
    const metalsmith = createMetalsmith(t)
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
    const metalsmith = createMetalsmith(t).use(convert(compileOptions));
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
        const metalsmith = createMetalsmith(t).use(compile(compileOptions));
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

test('should destroys an object reference from source file to destination file: convert()', async t => {
    const sourceFiles: Metalsmith.Files = {};
    const destFiles: Metalsmith.Files = {};

    const metalsmith = createMetalsmith(t)
        .use((files, metalsmith, done) => {
            Object.assign(sourceFiles, files);
            done(null, files, metalsmith);
        })
        .use(convert())
        .use((files, metalsmith, done) => {
            Object.assign(destFiles, files);
            done(null, files, metalsmith);
        });

    await assertMetalsmithBuild({
        t,
        metalsmith,
    });

    t.true(sourceFiles['index.pug'] !== destFiles['index.html']);
});

test('should destroys an object reference from source file to compiled file: compile()', async t => {
    const sourceFiles: Metalsmith.Files = {};
    const compiledFiles: Metalsmith.Files = {};

    const metalsmith = createMetalsmith(t)
        .use((files, metalsmith, done) => {
            Object.assign(sourceFiles, files);
            done(null, files, metalsmith);
        })
        .use(compile())
        .use((files, metalsmith, done) => {
            Object.assign(compiledFiles, files);
            done(null, files, metalsmith);
        })
        .use(render());

    await assertMetalsmithBuild({
        t,
        metalsmith,
    });

    t.true(sourceFiles['index.pug'] !== compiledFiles['index.html']);
});

test('should keep an object reference from compiled file to rendered file: render()', async t => {
    const compiledFiles: Metalsmith.Files = {};
    const renderedFiles: Metalsmith.Files = {};

    const metalsmith = createMetalsmith(t)
        .use(compile())
        .use((files, metalsmith, done) => {
            Object.assign(compiledFiles, files);
            done(null, files, metalsmith);
        })
        .use(render())
        .use((files, metalsmith, done) => {
            Object.assign(renderedFiles, files);
            done(null, files, metalsmith);
        });

    await assertMetalsmithBuild({
        t,
        metalsmith,
    });

    t.true(compiledFiles['index.html'] === renderedFiles['index.html']);
    t.true(
        renderedFiles['index.html'].contents.length > 0,
        'file contents updated',
    );
});

test('should copy from source file data to destination file data: convert()', async t => {
    const sourceFiles: Metalsmith.Files = {};
    const destFiles: Metalsmith.Files = {};

    const metalsmith = createMetalsmith(t)
        .use(
            setLocalsPlugin({
                hoge: 'fuga',
                x: 42,
            }),
        )
        .use((files, metalsmith, done) => {
            Object.assign(sourceFiles, files);
            done(null, files, metalsmith);
        })
        .use(
            convert({
                copyFileData: true,
            }),
        )
        .use((files, metalsmith, done) => {
            Object.assign(destFiles, files);
            done(null, files, metalsmith);
        });

    await assertMetalsmithBuild({
        t,
        metalsmith,
    });

    t.true(sourceFiles['index.pug'] !== destFiles['index.html']);
    t.deepEqual(
        Object.keys(destFiles['index.html']).sort(),
        Object.keys(sourceFiles['index.pug']).sort(),
    );
});

test('should not copy from source file data to destination file data: convert()', async t => {
    const sourceFiles: Metalsmith.Files = {};
    const destFiles: Metalsmith.Files = {};

    const metalsmith = createMetalsmith(t)
        .use(
            setLocalsPlugin({
                hoge: 'fuga',
                x: 42,
            }),
        )
        .use((files, metalsmith, done) => {
            Object.assign(sourceFiles, files);
            done(null, files, metalsmith);
        })
        .use(
            convert({
                copyFileData: false,
            }),
        )
        .use((files, metalsmith, done) => {
            Object.assign(destFiles, files);
            done(null, files, metalsmith);
        });

    await assertMetalsmithBuild({
        t,
        metalsmith,
    });

    t.true(sourceFiles['index.pug'] !== destFiles['index.html']);
    t.notDeepEqual(
        Object.keys(destFiles['index.html']).sort(),
        Object.keys(sourceFiles['index.pug']).sort(),
    );
});

test('should copy from source file data to compiled file data: compile()', async t => {
    const sourceFiles: Metalsmith.Files = {};
    const compiledFiles: Metalsmith.Files = {};

    const metalsmith = createMetalsmith(t)
        .use(
            setLocalsPlugin({
                hoge: 'fuga',
                x: 42,
            }),
        )
        .use((files, metalsmith, done) => {
            Object.assign(sourceFiles, files);
            done(null, files, metalsmith);
        })
        .use(
            compile({
                copyFileData: true,
            }),
        )
        .use((files, metalsmith, done) => {
            Object.assign(compiledFiles, files);
            done(null, files, metalsmith);
        })
        .use(render());

    await assertMetalsmithBuild({
        t,
        metalsmith,
    });

    t.true(sourceFiles['index.pug'] !== compiledFiles['index.html']);
    t.deepEqual(
        Object.keys(compiledFiles['index.html']).sort(),
        Object.keys(sourceFiles['index.pug']).sort(),
    );
});

test('should not copy from source file data to compiled file data: compile()', async t => {
    const sourceFiles: Metalsmith.Files = {};
    const compiledFiles: Metalsmith.Files = {};

    const metalsmith = createMetalsmith(t)
        .use(
            setLocalsPlugin({
                hoge: 'fuga',
                x: 42,
            }),
        )
        .use((files, metalsmith, done) => {
            Object.assign(sourceFiles, files);
            done(null, files, metalsmith);
        })
        .use(
            compile({
                copyFileData: false,
            }),
        )
        .use((files, metalsmith, done) => {
            Object.assign(compiledFiles, files);
            done(null, files, metalsmith);
        })
        .use(render());

    await assertMetalsmithBuild({
        t,
        metalsmith,
    });

    t.true(sourceFiles['index.pug'] !== compiledFiles['index.html']);
    t.notDeepEqual(
        Object.keys(compiledFiles['index.html']).sort(),
        Object.keys(sourceFiles['index.pug']).sort(),
    );
});

for (const useMetadata of [true, false]) {
    test(`should not change options value: convert() useMetadata=${useMetadata}`, async t => {
        const convertOptions = {
            locals: { C: 3 },
            useMetadata,
        };
        const beforeOptions = cloneDeep(convertOptions);

        const metalsmith = createMetalsmith(t)
            .metadata({ A: 1 })
            .use(setLocalsPlugin({ B: 2 }))
            .use(convert(convertOptions));

        await assertMetalsmithBuild({
            t,
            metalsmith,
        });

        t.deepEqual(convertOptions, beforeOptions);
    });
}

for (const useMetadata of [true, false]) {
    test(`should not change options value: compile() & render() useMetadata=${useMetadata}`, async t => {
        const compileOptions = {};
        const renderOptions = {
            locals: { C: 3 },
            useMetadata,
        };
        const beforeCompileOptions = cloneDeep(compileOptions);
        const beforeRenderOptions = cloneDeep(renderOptions);

        const metalsmith = createMetalsmith(t)
            .metadata({ A: 1 })
            .use(compile())
            .use(setLocalsPlugin({ B: 2 }))
            .use(render(renderOptions));

        await assertMetalsmithBuild({
            t,
            metalsmith,
        });

        t.deepEqual(compileOptions, beforeCompileOptions);
        t.deepEqual(renderOptions, beforeRenderOptions);
    });
}

for (const useMetadata of [true, false]) {
    test(`should not change locals value by the template logic: convert() useMetadata=${useMetadata}`, async t => {
        const locals = {
            count: 1,
            state: {
                count: 1,
            },
        };
        const beforeLocals = cloneDeep(locals);

        const metalsmith = createMetalsmith(t)
            .source('change-locals')
            .use(convert({ locals, useMetadata, self: true }));

        await assertMetalsmithBuild({
            t,
            metalsmith,
        });

        t.deepEqual(locals, beforeLocals);
    });
}

for (const useMetadata of [true, false]) {
    test(`should not change locals value by the template logic: compile() & render() useMetadata=${useMetadata}`, async t => {
        const locals = {
            count: 1,
            state: {
                count: 1,
            },
        };
        const beforeLocals = cloneDeep(locals);

        const metalsmith = createMetalsmith(t)
            .source('change-locals')
            .use(compile({ self: true }))
            .use(render({ locals, useMetadata }));

        await assertMetalsmithBuild({
            t,
            metalsmith,
        });

        t.deepEqual(locals, beforeLocals);
    });
}

test('should render only the file specified by the pattern option', async t => {
    const metalsmith = createMetalsmith(t)
        .use(compile())
        .use((files, metalsmith, done) => {
            t.not(
                files['index.html'].contents.toString(),
                '<h1>Hello World</h1>',
            );
            t.not(files['self-closing.html'].contents.toString(), '<br/>');
            done(null, files, metalsmith);
        })
        .use(
            render({
                pattern: ['index.html'],
            }),
        )
        .use((files, metalsmith, done) => {
            t.is(
                files['index.html'].contents.toString(),
                '<h1>Hello World</h1>',
            );
            t.not(files['self-closing.html'].contents.toString(), '<br/>');
            done(null, files, metalsmith);
        });

    await assertMetalsmithBuild({
        t,
        metalsmith,
    });
});
