import test from 'ava';
import cloneDeep from 'lodash.clonedeep';

import { compile, getCompileOptions } from '../src/compile';
import { convert } from '../src/convert';
import { getRenderOptions, render } from '../src/render';
import { ignoreTypeError } from './helpers';

test('compile.defaultOptions cannot be changed', t => {
    const originalValue = cloneDeep(compile.defaultOptions);

    ignoreTypeError(() => {
        // @ts-ignore: TS2339
        compile.defaultOptions.hoge = 'fuga';
    });
    t.deepEqual(
        compile.defaultOptions,
        originalValue,
        'Properties cannot be added',
    );

    ignoreTypeError(() => {
        // @ts-ignore: TS2540
        compile.defaultOptions.renamer = (s: string) => s;
    });
    ignoreTypeError(() => {
        if (Array.isArray(compile.defaultOptions.pattern)) {
            compile.defaultOptions.pattern.push('**/*.jade');
        }
    });
    t.deepEqual(
        compile.defaultOptions,
        originalValue,
        'Properties cannot be changed',
    );

    ignoreTypeError(() => {
        // @ts-ignore: TS2540
        compile.defaultOptions = 42;
    });
    t.deepEqual(
        compile.defaultOptions,
        originalValue,
        'defaultOptions property cannot be changed',
    );
});

test('render.defaultOptions cannot be changed', t => {
    const originalValue = cloneDeep(render.defaultOptions);

    ignoreTypeError(() => {
        // @ts-ignore: TS2339
        render.defaultOptions.hoge = 'fuga';
    });
    t.deepEqual(
        render.defaultOptions,
        originalValue,
        'Properties cannot be added',
    );

    ignoreTypeError(() => {
        // @ts-ignore: TS2542
        render.defaultOptions.locals.π = Math.PI;
    });
    ignoreTypeError(() => {
        // @ts-ignore: TS2540
        render.defaultOptions.useMetadata = true;
    });
    t.deepEqual(
        render.defaultOptions,
        originalValue,
        'Properties cannot be changed',
    );

    ignoreTypeError(() => {
        // @ts-ignore: TS2540
        render.defaultOptions = 42;
    });
    t.deepEqual(
        render.defaultOptions,
        originalValue,
        'defaultOptions property cannot be changed',
    );
});

test('convert.defaultOptions cannot be changed', t => {
    const originalValue = cloneDeep(convert.defaultOptions);

    ignoreTypeError(() => {
        // @ts-ignore: TS2339
        convert.defaultOptions.hoge = 'fuga';
    });
    t.deepEqual(
        convert.defaultOptions,
        originalValue,
        'Properties cannot be added',
    );

    ignoreTypeError(() => {
        // @ts-ignore: TS2542
        convert.defaultOptions.locals.cwd = process.cwd();
    });
    ignoreTypeError(() => {
        // @ts-ignore: TS2540
        convert.defaultOptions.useMetadata = true;
    });
    ignoreTypeError(() => {
        if (Array.isArray(convert.defaultOptions.pattern)) {
            convert.defaultOptions.pattern.push('**/*.jade');
        }
    });
    t.deepEqual(
        convert.defaultOptions,
        originalValue,
        'Properties cannot be changed',
    );

    ignoreTypeError(() => {
        // @ts-ignore: TS2540
        convert.defaultOptions = 42;
    });
    t.deepEqual(
        convert.defaultOptions,
        originalValue,
        'defaultOptions property cannot be changed',
    );
});

test('getCompileOptions().otherOptions excludes CompileOptionsInterface', t => {
    const pugOptions = {
        basedir: __dirname,
        doctype: 'html',
        cache: true,
    };

    t.deepEqual(
        getCompileOptions({ ...pugOptions, ...compile.defaultOptions })
            .otherOptions,
        pugOptions,
    );
});

test('getRenderOptions().otherOptions excludes RenderOptionsInterface', t => {
    const pugOptions = {
        basedir: __dirname,
        doctype: 'html',
        cache: true,
    };

    t.deepEqual(
        getRenderOptions({ ...pugOptions, ...render.defaultOptions })
            .otherOptions,
        pugOptions,
    );
});
