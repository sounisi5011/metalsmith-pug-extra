import test from 'ava';

import { compile, convert, render } from '../src';
import {
    assertFileConverted,
    assertFileNotConverted,
    generateMetalsmithCreator,
} from './helpers';

const createMetalsmith = generateMetalsmithCreator(__filename);

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
