import test from 'ava';
import pugConvert from '../src';

const methodMap = new Map([['convert()', pugConvert]]);

test('methods have defaultOptions property', t => {
    methodMap.forEach((value, key) => {
        t.is(typeof value.defaultOptions, 'object', key);
    });
});

test('defaultOptions.pattern', t => {
    const validDefaultPattern = ['**/*.pug'];

    methodMap.forEach((value, key) => {
        t.deepEqual(validDefaultPattern, value.defaultOptions.pattern, key);
    });
});

test('defaultOptions.renamer', t => {
    const validReplaceList = [
        ['index.pug', 'index.html'],
        ['basename.pug', 'basename.html'],
        ['.pug', '.html'],
        ['basename.html.pug', 'basename.html.html'],
        ['basename.pug.pug', 'basename.pug.html'],
        ['basename.pug.html', 'basename.pug.html'],
        ['basename.pug.', 'basename.pug.'],

        ['index.jade', 'index.html'],
        ['basename.jade', 'basename.html'],
        ['.jade', '.html'],
        ['basename.html.jade', 'basename.html.html'],
        ['basename.jade.jade', 'basename.jade.html'],
        ['basename.jade.html', 'basename.jade.html'],
        ['basename.jade.', 'basename.jade.'],

        ['dirname/index.pug', 'dirname/index.html'],
        ['dirname/basename.pug', 'dirname/basename.html'],
        ['dirname/.pug', 'dirname/.html'],
        ['dirname/basename.html.pug', 'dirname/basename.html.html'],
        ['dirname/basename.pug.pug', 'dirname/basename.pug.html'],
        ['dirname/basename.pug.html', 'dirname/basename.pug.html'],
        ['dirname/basename.pug.', 'dirname/basename.pug.'],

        ['/index.pug', '/index.html'],
        ['/basename.pug', '/basename.html'],
        ['/.pug', '/.html'],
        ['/basename.html.pug', '/basename.html.html'],
        ['/basename.pug.pug', '/basename.pug.html'],
        ['/basename.pug.html', '/basename.pug.html'],
        ['/basename.pug.', '/basename.pug.'],
    ];

    validReplaceList.forEach(([filename, newFilename]) => {
        methodMap.forEach((value, methodName) => {
            t.is(
                newFilename,
                value.defaultOptions.renamer(filename),
                `${methodName}: ${filename} -> ${newFilename}`,
            );
        });
    });
});
