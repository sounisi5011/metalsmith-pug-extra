import test from 'ava';

import { compile, convert, render } from '../src';
import {
    assertFileConverted,
    assertFilesPlugin,
    assertMetalsmithBuild,
    createMetalsmith,
    readSourceFile,
} from './helpers';

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
