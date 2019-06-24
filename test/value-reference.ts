import test from 'ava';
import cloneDeep from 'lodash.clonedeep';
import Metalsmith from 'metalsmith';

import { compile, convert, render } from '../src';
import {
    assertMetalsmithBuild,
    createMetalsmith,
    setLocalsPlugin,
} from './helpers';

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
