import test from 'ava';
import pug from 'pug';
import sinon from 'sinon';

import { compile, convert, render } from '../src';
import {
    assertFileConverted,
    assertMetalsmithBuild,
    generateMetalsmithCreator,
    objIgnoreKeys,
} from './helpers';

const createMetalsmith = generateMetalsmithCreator(__filename);

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
