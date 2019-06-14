import test from 'ava';
import pugConvert, { compile, render } from '../src';

const methodMap = new Map<string, pugConvert | compile | render>([
    ['convert()', pugConvert],
    ['compile()', compile],
    ['render()', render],
]);

const compileMethodMap = new Map<string, pugConvert | compile>([
    ['convert()', pugConvert],
    ['compile()', compile],
]);

methodMap.forEach((value, key) => {
    test(`${key} methods have defaultOptions property`, t => {
        t.is(typeof value.defaultOptions, 'object');
    });
});

compileMethodMap.forEach((value, key) => {
    test(`${key}: defaultOptions.pattern`, t => {
        const validDefaultPattern = ['**/*.pug'];
        t.deepEqual(validDefaultPattern, value.defaultOptions.pattern);
    });
});

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
compileMethodMap.forEach((value, methodName) => {
    test(`${methodName}: defaultOptions.renamer`, t => {
        validReplaceList.forEach(([filename, newFilename]) => {
            t.is(
                newFilename,
                value.defaultOptions.renamer(filename),
                `${filename} -> ${newFilename}`,
            );
        });
    });
});
