# metalsmith-pug-extra

[![npm package](https://img.shields.io/npm/v/metalsmith-pug-extra.svg)][npm]
[![GitHub License](https://img.shields.io/github/license/sounisi5011/metalsmith-pug-extra.svg)][github-license]
![](https://img.shields.io/node/v/metalsmith-pug-extra.svg)
[![Dependencies Status](https://david-dm.org/sounisi5011/metalsmith-pug-extra/status.svg)](https://david-dm.org/sounisi5011/metalsmith-pug-extra)
[![Linux Build Status](https://img.shields.io/travis/com/sounisi5011/metalsmith-pug-extra/master.svg?label=Linux%20build)](https://travis-ci.com/sounisi5011/metalsmith-pug-extra)
[![Windows Build Status](https://img.shields.io/appveyor/ci/sounisi5011/metalsmith-pug-extra/master.svg?label=Windows%20build&logo=appveyor)](https://ci.appveyor.com/project/sounisi5011/metalsmith-pug-extra/branch/master)
[![Maintainability Status](https://api.codeclimate.com/v1/badges/f8efa3c8c8bc40f9da37/maintainability)](https://codeclimate.com/github/sounisi5011/metalsmith-pug-extra/maintainability)

[npm]: https://www.npmjs.com/package/metalsmith-pug-extra
[github-license]: https://github.com/sounisi5011/metalsmith-pug-extra/blob/master/LICENSE

[Metalsmith] plugin to convert or compile and render [Pug] files.

[Metalsmith]: https://metalsmith.io/
[Pug]: https://pugjs.org/

## In addition to [metalsmith-pug]:

[metalsmith-pug]: https://github.com/ahmadnassri/metalsmith-pug
[metalsmith-collections]: https://github.com/segmentio/metalsmith-collections
[metalsmith-permalinks]: https://github.com/segmentio/metalsmith-permalinks
[metalsmith-excerpts]: https://github.com/segmentio/metalsmith-excerpts

* API to execute render after compile

  You can insert [metalsmith-collections], [metalsmith-permalinks], etc. between compile and render.
  This is the biggest reason for this package to exist.

* Modify metadata after conversion and reconvert

  You can convert the converted HTML as many times as you like.
  For example, you can use [metalsmith-excerpts] for converted HTML and convert the HTML again using the retrieved excerpt values.

* Customizable rename logic

  You can freely specify the file name after conversion.
  See the `renamer` option.

* Option to prohibit overwriting

  You can specify not to overwrite files if they are duplicated.
  See the `overwrite` option.

* Available in [TypeScript](https://www.typescriptlang.org/)

  Type definition is included.

## Install

```sh
npm install --save metalsmith-pug-extra
```

## Usage

### [`convert()`](#convertoptions)

Convert template files to HTML.

```js
const Metalsmith = require('metalsmith');
const { convert } = require('metalsmith-pug-extra');

const options = {
  pattern: ['**/*.pug', '**/*.jade'],
  overwrite: false,
  copyFileData: true,
  useMetadata: true,
  locals: {
    postName: 'good post name'
  }
};

Metalsmith(__dirname)
  .use(convert(options))
```

### [`compile()`](#compileoptions) & [`render()`](#renderoptions)

After compiling the template file, it is processed by plugins such as renaming ([metalsmith-collections] and [metalsmith-permalinks] in this example) and finally the HTML content is generated.

```js
const Metalsmith = require('metalsmith');
const collections = require('metalsmith-collections');
const permalinks  = require('metalsmith-permalinks');
const { compile, render } = require('metalsmith-pug-extra');

const compileOptions = {
  pattern: ['**/*.pug', '**/*.jade'],
  overwrite: false,
  copyFileData: true
};
const renderOptions = {
  useMetadata: true,
  locals: {
    postName: 'good post name'
  }
};

Metalsmith(__dirname)
  .use(compile(compileOptions))
  .use(collections({
    posts: 'posts/*.html'
  }))
  .use(permalinks())
  .use(render(renderOptions))
```

## API

### `convert(options?)`

Returns a plugin that converts [Pug] template files to HTML files.  
Except for differences in options, this is equivalent to such as [metalsmith-pug] and [metalsmith-in-place].

[metalsmith-in-place]: https://github.com/metalsmith/metalsmith-in-place

#### Options

<details>
<summary>pattern</summary>

Only files that match this pattern will be processed.  
Specify a glob expression string or an array of strings as the pattern.  
Pattern are verified using [multimatch v4.0.0].

[multimatch v4.0.0]: https://www.npmjs.com/package/multimatch/v/4.0.0

Default value:

```js
['**/*.pug']
```

Type definition:

```ts
string | string[]
```
</details>

<details>
<summary>renamer</summary>

Convert template filename to HTML filename.  
Specifies a function to convert strings.

Default value:

```js
filename => filename.replace(/\.(?:pug|jade)$/, '.html')
```

Type definition:

```ts
(filename: string) => string
```
</details>

<details>
<summary>overwrite</summary>

If set to `true`, the file with the same name as the converted HTML will be overwritten.  
If set to `false`, the file with the same name as the converted HTML is prioritized and HTML is not generated.

Default value:

```js
true
```

Type definition:

```ts
boolean
```
</details>

<details>
<summary>copyFileData</summary>

If set to `true`, the template file metadata is copied to the converted HTML file.

Default value:

```js
false
```

Type definition:

```ts
boolean
```
</details>

<details>
<summary>locals</summary>

Pass additional local values to the template.  
If `useMetadata` option is `true`, this value will be overwritten with [Metalsmith]'s metadata.

Default value:

```js
{}
```

Type definition:

```ts
// see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/54642d812e28de52325a689d0b380f7a4d3c113e/types/pug/index.d.ts#L133-L138
{
    [propName: string]: any;
}
```
</details>

<details>
<summary>useMetadata</summary>

If set to `true`, passes [Metalsmith's global metadata] and file metadata to the template.

[Metalsmith's global metadata]: https://metalsmith.io/#-metadata-json-

Default value:

```js
false
```

Type definition:

```ts
boolean
```
</details>

<details>
<summary>pug options</summary>

Other properties are used as options for [Pug v2.0.4].  
In internal processing, it is passed as an argument of [`pug.compile()`] function.  
Please check [Pug Options] for more details.

[Pug v2.0.4]: https://www.npmjs.com/package/pug/v/2.0.4
[Pug Options]: https://pugjs.org/api/reference.html#options
[`pug.compile()`]: https://pugjs.org/api/reference.html#pugcompilesource-options
</details>

### `convert.defaultOptions`

Default value of the `convert()` function options argument.  
It can be used to specify an options based on the default value.

```js
Metalsmith(__dirname)
  .use(convert({
    pattern: [].concat(convert.defaultOptions.pattern, '!_*/**', '!**/_*', '!**/_*/**')
    // equals to: [ '**/*.pug', '!_*/**', '!**/_*', '!**/_*/**' ]
  }))
```

### `compile(options?)`

Returns a plugin that compiles [Pug] templates.

The file name is changed to `*.html` but the template is not converted.  
You can use other plugins to generate locals before converting the template with the `render()` plugin.

#### Options

<details>
<summary>pattern</summary>

Only files that match this pattern will be processed.  
Specify a glob expression string or an array of strings as the pattern.  
Pattern are verified using [multimatch v4.0.0].

Default value:

```js
['**/*.pug']
```

Type definition:

```ts
string | string[]
```
</details>

<details>
<summary>renamer</summary>

Convert template filename to HTML filename.  
Specifies a function to convert strings.

Default value:

```js
filename => filename.replace(/\.(?:pug|jade)$/, '.html')
```

Type definition:

```ts
(filename: string) => string
```
</details>

<details>
<summary>overwrite</summary>

If set to `true`, the file with the same name as the converted HTML will be overwritten.  
If set to `false`, the file with the same name as the converted HTML is prioritized and HTML is not generated.

Default value:

```js
true
```

Type definition:

```ts
boolean
```
</details>

<details>
<summary>copyFileData</summary>

If set to `true`, the template file metadata is copied to the converted HTML file.

Default value:

```js
false
```

Type definition:

```ts
boolean
```
</details>

<details>
<summary>pug options</summary>

Other properties are used as options for [Pug v2.0.4].  
In internal processing, it is passed as an argument of [`pug.compile()`] function.  
Please check [Pug Options] for more details.
</details>

### `compile.defaultOptions`

Default value of the `compile()` function options argument.  
It can be used to specify an options based on the default value.

### `render(options?)`

Returns a plugin that generates HTML content from a compiled template.  
Files compiled with the `compile()` function are processed.

This plugin can also reconvert generated HTML.  
Therefore, you can use [metalsmith-excerpts] etc. effectively.

#### Options

<details>
<summary>locals</summary>

Pass additional local values to the template.  
If `useMetadata` option is `true`, this value will be overwritten with [Metalsmith]'s metadata.

Default value:

```js
{}
```

Type definition:

```ts
// see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/54642d812e28de52325a689d0b380f7a4d3c113e/types/pug/index.d.ts#L133-L138
{
    [propName: string]: any;
}
```
</details>

<details>
<summary>useMetadata</summary>

If set to `true`, passes [Metalsmith's global metadata] and file metadata to the template.

Default value:

```js
false
```

Type definition:

```ts
boolean
```
</details>

<details>
<summary>pattern</summary>

Only files that match this pattern will be processed.  
Specify a glob expression string or an array of strings as the pattern.  
Pattern are verified using [multimatch v4.0.0].

Default value:

```js
['**/*']
```

Type definition:

```ts
string | string[]
```
</details>

<details>
<summary>reuse</summary>

If set to `true`, it will reuse the options value set in the `render()` function just before.  
This option is intended to improve the convenience of regenerating generated HTML.

Default value:

```js
false
```

Type definition:

```ts
boolean
```

Example:

```js
const Metalsmith = require('metalsmith');
const excerpts = require('metalsmith-excerpts');
const { compile, render } = require('metalsmith-pug-extra');

Metalsmith(__dirname)
  .use(compile({ copyFileData: true }))
  .use(render({
    locals: {
      a: 1,
      b: 2,
    },
    useMetadata: true,
    pattern: ['articles/*'],
  }))
  .use(excerpts())
  .use(render({
    reuse: true,
    pattern: render.defaultOptions.pattern,
    /*
    equals to:
    {
      locals: {
        a: 1,
        b: 2,
      },
      useMetadata: true,
      pattern: render.defaultOptions.pattern,
    }
    */
  }))
```
</details>

### `render.defaultOptions`

Default value of the `render()` function options argument.  
It can be used to specify an options based on the default value.

## Debug mode

This plugin supports debugging output.  
To enable, use the following command when running your build script:

```sh
DEBUG=metalsmith-pug-extra:* node my-website-build.js
```

For more details, please check the description of [debug v4.1.1].

[debug v4.1.1]: https://www.npmjs.com/package/debug/v/4.1.1

## Tests

To run the test suite, first install the dependencies, then run `npm test`:

```sh
npm install
npm test
```

## CLI Usage

For now, this plugin does not support [Metalsmith CLI].  
I am planning to add [Metalsmith CLI] support in version 2.x.  
See [#28] for details.

[Metalsmith CLI]: https://github.com/segmentio/metalsmith/blob/v2.3.0/Readme.md#cli
[#28]: https://github.com/sounisi5011/metalsmith-pug-extra/issues/28
