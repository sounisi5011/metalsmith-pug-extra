import test from 'ava';
import cloneDeep from 'lodash.clonedeep';

import { getCompileOptions, compile } from '../src/compile';
import { getRenderOptions, render } from '../src/render';
import { convert } from '../src/convert';

function ignoreTypeError(callback: () => void): void {
    try {
        callback();
    } catch (error) {
        if (!(error instanceof TypeError)) {
            throw error;
        }
    }
}

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

    ignoreTypeError(() => (compile.defaultOptions.renamer = s => s));
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
        // @ts-ignore: TS2322
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

    ignoreTypeError(() => (render.defaultOptions.locals.π = Math.PI));
    ignoreTypeError(() => (render.defaultOptions.useMetadata = true));
    t.deepEqual(
        render.defaultOptions,
        originalValue,
        'Properties cannot be changed',
    );

    ignoreTypeError(() => {
        // @ts-ignore: TS2322
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

    ignoreTypeError(() => (convert.defaultOptions.locals.cwd = process.cwd()));
    ignoreTypeError(() => (convert.defaultOptions.useMetadata = true));
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
        // @ts-ignore: TS2322
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
