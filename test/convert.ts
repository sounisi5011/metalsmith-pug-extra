import test from 'ava';
import Metalsmith from 'metalsmith';

import { compile, convert, render } from '../src';
import {
    assertFileConverted,
    assertFilesPlugin,
    assertMetalsmithBuild,
    generateMetalsmithCreator,
    getFileContentsPlugin,
    readSourceFile,
    sleep,
} from './helpers';

const createMetalsmith = generateMetalsmithCreator(__filename);

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

test('should overwrite it when call render() again', async t => {
    let firstRenderedContents: string | null | undefined = null;
    let secondRenderedContents: string | null | undefined = null;

    const metalsmith = createMetalsmith(t)
        .source('always-different')
        .use(compile())
        .use(render())
        .use(
            getFileContentsPlugin('now.html', contents => {
                firstRenderedContents = contents;
            }),
        )
        .use(render())
        .use(
            getFileContentsPlugin('now.html', contents => {
                secondRenderedContents = contents;
            }),
        );

    await assertMetalsmithBuild({
        t,
        metalsmith,
    });

    t.not(firstRenderedContents, null, 'variable must be overwritten');
    t.not(secondRenderedContents, null, 'variable must be overwritten');

    t.truthy(firstRenderedContents, 'must be rendered');
    t.truthy(secondRenderedContents, 'must be rendered');

    t.not(
        secondRenderedContents,
        firstRenderedContents,
        'contents must be changed',
    );
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

/*
 * options.reuse testing
 */

{
    const renderOptions = {
        locals: {
            A: 1,
            B: 2,
            E: 42,
        },
    };
    const optionsUsedFileContents = {
        'locals.html': 'A:1 B:2 E:42 ',
    };
    function testFiles(
        files: Metalsmith.Files,
        callback: (
            fileContents: string,
            expectedContents: string,
            filename: string,
        ) => void,
    ): void {
        Object.entries(optionsUsedFileContents).forEach(
            ([filename, contentStr]) => {
                callback(
                    files[filename].contents.toString(),
                    contentStr,
                    filename,
                );
            },
        );
    }

    test('should reuse options of render() function', async t => {
        const metalsmith = createMetalsmith(t)
            .use(compile())
            .use(render(renderOptions))
            .use((files, metalsmith, done) => {
                testFiles(files, (fileContents, expectedContents, filename) => {
                    t.is(
                        fileContents,
                        expectedContents,
                        `1st rendered: ${filename}`,
                    );
                });
                done(null, files, metalsmith);
            })
            .use(render({ reuse: true }))
            .use((files, metalsmith, done) => {
                testFiles(files, (fileContents, expectedContents, filename) => {
                    t.is(
                        fileContents,
                        expectedContents,
                        `2nd rendered: ${filename}`,
                    );
                });
                done(null, files, metalsmith);
            });

        await assertMetalsmithBuild({
            t,
            metalsmith,
        });
    });

    test('should not reuse options of render() function', async t => {
        const metalsmith = createMetalsmith(t)
            .use(compile())
            .use(render(renderOptions))
            .use((files, metalsmith, done) => {
                testFiles(files, (fileContents, expectedContents, filename) => {
                    t.is(
                        fileContents,
                        expectedContents,
                        `1st rendered: ${filename}`,
                    );
                });
                done(null, files, metalsmith);
            })
            .use(render({ reuse: false }))
            .use((files, metalsmith, done) => {
                testFiles(files, (fileContents, expectedContents, filename) => {
                    t.not(
                        fileContents,
                        expectedContents,
                        `2nd rendered: ${filename}`,
                    );
                });
                done(null, files, metalsmith);
            });

        await assertMetalsmithBuild({
            t,
            metalsmith,
        });
    });
}

test('should merge reuse option and other options', async t => {
    const destFilename = 'locals.html';
    const globalMetadata = { A: 1, B: 2 };
    const renderOptionsList: {
        options: Parameters<typeof render>[0];
        test: Parameters<typeof getFileContentsPlugin>[1];
    }[] = [
        {
            options: { useMetadata: true },
            test(contents) {
                t.is(
                    contents,
                    'A:1 B:2 ',
                    '1st render; enable useMetadata option',
                );
            },
        },
        {
            options: { reuse: true },
            test(contents) {
                t.is(
                    contents,
                    'A:1 B:2 ',
                    '2nd render; reuse 1st render options',
                );
            },
        },
        {
            options: { reuse: true, locals: { C: 3, D: 4 } },
            test(contents) {
                t.is(
                    contents,
                    'A:1 B:2 C:3 D:4 ',
                    '3rd render; reuse 2nd render options and add locals option',
                );
            },
        },
        {
            options: { reuse: true },
            test(contents) {
                t.is(
                    contents,
                    'A:1 B:2 C:3 D:4 ',
                    '4th render; reuse 3rd render options',
                );
            },
        },
        {
            options: { reuse: true, locals: { E: 42 } },
            test(contents) {
                t.is(
                    contents,
                    'A:1 B:2 E:42 ',
                    '5th render; reuse 4th render options and overwrite locals option',
                );
            },
        },
        {
            options: { reuse: true },
            test(contents) {
                t.is(
                    contents,
                    'A:1 B:2 E:42 ',
                    '6th render; reuse 5th render options',
                );
            },
        },
        {
            options: { reuse: true, useMetadata: false },
            test(contents) {
                t.is(
                    contents,
                    'E:42 ',
                    '7th render; reuse 6th render options and disable useMetadata option',
                );
            },
        },
        {
            options: { reuse: true },
            test(contents) {
                t.is(contents, 'E:42 ', '8th render; reuse 7th render options');
            },
        },
    ];

    const metalsmith = createMetalsmith(t)
        .metadata(globalMetadata)
        .use(compile())
        .use(
            renderOptionsList
                .map(({ options, test }) => [
                    render(options),
                    getFileContentsPlugin(destFilename, test),
                ])
                .reduce((a, b) => [...a, ...b], []),
        );

    await assertMetalsmithBuild({
        t,
        metalsmith,
    });
});

test('should reuse render() options even for files that were not rendered before', async t => {
    const targetFile = 'locals.html';
    const targetFileContents = 'A:1 B:2 E:42 ';

    const metalsmith = createMetalsmith(t)
        .use(compile())
        .use(
            render({
                pattern: `!${targetFile}`,
                locals: {
                    A: 1,
                    B: 2,
                    E: 42,
                },
            }),
        )
        .use((files, metalsmith, done) => {
            t.not(
                files[targetFile].contents.toString(),
                targetFileContents,
                `1st render; ${targetFile} should not be rendered`,
            );
            done(null, files, metalsmith);
        })
        .use(
            render({
                reuse: true,
                pattern: render.defaultOptions.pattern,
            }),
        )
        .use((files, metalsmith, done) => {
            t.is(
                files[targetFile].contents.toString(),
                targetFileContents,
                `2nd render; ${targetFile} should be rendered`,
            );
            done(null, files, metalsmith);
        });

    await assertMetalsmithBuild({
        t,
        metalsmith,
    });
});

test('should reuse render() options per Metalsmith instances', async t => {
    const destFilename = 'locals.html';
    const metalsmithList = await Promise.all(
        [...Array(6)].map(async (_, index) => {
            const metalsmith = createMetalsmith(t, `index-${index}`).use(
                compile(),
            );

            metalsmith.use([
                render({ locals: { A: `${index}` } }),
                getFileContentsPlugin(destFilename, async contents => {
                    t.is(
                        contents,
                        `A:${index} `,
                        `1st render / index=${index}`,
                    );

                    // Wait 0.5 seconds if index is odd
                    // Delay execution of render plugin
                    await sleep((index % 2) * 0.5);
                }),
            ]);

            // Wait 0.5 seconds if index is even
            // Delay execution of render() function
            await sleep((1 - (index % 2)) * 0.5);

            metalsmith.use([
                render({ reuse: true }),
                getFileContentsPlugin(destFilename, contents => {
                    t.is(
                        contents,
                        `A:${index} `,
                        `2nd render / index=${index}`,
                    );
                }),
            ]);

            return metalsmith;
        }),
    );

    await Promise.all(
        metalsmithList
            .reverse()
            .map(metalsmith => assertMetalsmithBuild({ t, metalsmith })),
    );
});
