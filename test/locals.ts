import test from 'ava';
import Metalsmith from 'metalsmith';

import { compile, convert, render } from '../src';
import {
    assertFileConverted,
    assertMetalsmithBuild,
    generateMetalsmithCreator,
    setLocalsPlugin,
} from './helpers';

const createMetalsmith = generateMetalsmithCreator(__filename);

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
