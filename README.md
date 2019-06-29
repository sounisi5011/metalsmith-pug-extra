# metalsmith-pug-extra

[![npm version](https://img.shields.io/npm/v/metalsmith-pug-extra.svg)][npm]
[![GitHub License](https://img.shields.io/github/license/sounisi5011/metalsmith-pug-extra.svg)][github]
[![Build Status](https://travis-ci.com/sounisi5011/metalsmith-pug-extra.svg?branch=master)](https://travis-ci.com/sounisi5011/metalsmith-pug-extra)
[![Build status](https://ci.appveyor.com/api/projects/status/uolim1xgodpw3ft1/branch/master?svg=true)](https://ci.appveyor.com/project/sounisi5011/metalsmith-pug-extra/branch/master)
[![Maintainability](https://api.codeclimate.com/v1/badges/f8efa3c8c8bc40f9da37/maintainability)](https://codeclimate.com/github/sounisi5011/metalsmith-pug-extra/maintainability)

[npm]: https://www.npmjs.com/package/metalsmith-pug-extra
[github]: https://github.com/sounisi5011/metalsmith-pug-extra

[Metalsmith] plugin to convert or compile and render [Pug] files.

[Metalsmith]: https://metalsmith.io/
[Pug]: https://pugjs.org/

## In addition to [metalsmith-pug]:

[metalsmith-pug]: https://github.com/ahmadnassri/metalsmith-pug
[metalsmith-collections]: https://github.com/segmentio/metalsmith-collections
[metalsmith-permalinks]: https://github.com/segmentio/metalsmith-permalinks

* API to execute render after compile

  You can insert [metalsmith-collections], [metalsmith-permalinks], etc. between compile and render.
  This is the biggest reason for this package to exist.

* Customizable rename logic

  You can freely specify the file name after conversion.
  See the `renamer` option.

* Option to prohibit overwriting

  You can specify not to overwrite files if they are duplicated.
  See the `overwrite` option.

* Available in [TypeScript](https://www.typescriptlang.org/)

  Type definitions is included.

## Install

    yarn add metalsmith-pug-extra

or

    npm install --save metalsmith-pug-extra

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

After compiling the template file, it is processed by plug-ins such as renaming (`metalsmith-collections` and `metalsmith-permalinks` in this example) and finally the HTML content is generated.

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

Returns a plugin that converts [Pug] templates to HTML.
Except for differences in options, this is equivalent to such as [metalsmith-pug] and [metalsmith-in-place].

[metalsmith-in-place]: https://github.com/metalsmith/metalsmith-in-place

#### Options

<details>
<summary>pattern</summary>

Only files that match this pattern will be processed.  
Specify a glob expression string or an array of strings as the pattern.  
Patterns are verified using [multimatch v4.0.0].

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

Convert template filenames to HTML filenames.  
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
If `useMetadata` is `true`, this value will be overwritten with [Metalsmith]'s metadata.

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
Please check [Pug Options] for details.

[Pug v2.0.4]: https://pugjs.org/
[Pug Options]: https://pugjs.org/api/reference.html#options
[`pug.compile()`]: https://pugjs.org/api/reference.html#pugcompilesource-options
</details>

### `convert.defaultOptions`

Initial value of the option argument of the `convert()` function.
It can be used to specify an option based on the default value.

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

| Name               | Type                           | Required | Default        | Details                                              |
| ------------------ | ------------------------------ | -------- | -------------- | ---------------------------------------------------- |
| **`pattern`**      | `string \| string[]`            | `✖`      | `['**/*.pug']` | Only files that match this pattern will be processed |
| **`renamer`**      | `(filename: string) => string` | `✖`      | `filename => filename.replace(/\.(?:pug\|jade)$/, '.html')` | Change the file name |
| **`overwrite`**    | `boolean`                      | `✖`      | `true`         | Overwrite duplicate files |
| **`copyFileData`** | `boolean`                      | `✖`      | `false`        | Copy the data of the file before conversion to the file after conversion |
| **`*`**            |                                |          |                | Parameters to pass in the [`options`](https://pugjs.org/api/reference.html#options) argument of [`pug.compile()`](https://pugjs.org/api/reference.html#pugcompilesource-options) |

### `compile.defaultOptions`

Initial value of the option argument of the `compile()` function.
It can be used to specify an option based on the default value.

### `render(options?)`

#### Options

Converts a file processed by the `compile()` plugin from template to HTML.

| Name               | Type                           | Required | Default        | Details                                              |
| ------------------ | ------------------------------ | -------- | -------------- | ---------------------------------------------------- |
| **`locals`**       | `Object`                       | `✖`      | `{}`           | Pass additional locals to the template                  |
| **`useMetadata`**  | `boolean`                      | `✖`      | `false`        | Expose [Metalsmith's global metadata](https://metalsmith.io/#-metadata-json-) and file data to the [Pug] template |

### `render.defaultOptions`

Initial value of the option argument of the `render()` function.
It can be used to specify an option based on the default value.

## CLI Usage

For now, this plugin does not support [Metalsmith CLI].
I am planning to add [Metalsmith CLI] support in version 2.x.
See [#28] for details.

[Metalsmith CLI]: https://github.com/segmentio/metalsmith/blob/v2.3.0/Readme.md#cli
[#28]: https://github.com/sounisi5011/metalsmith-pug-extra/issues/28
