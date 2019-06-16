# metalsmith-pug-extra

[![Build Status](https://travis-ci.com/sounisi5011/metalsmith-pug-extra.svg?branch=master)](https://travis-ci.com/sounisi5011/metalsmith-pug-extra)
[![Build status](https://ci.appveyor.com/api/projects/status/uolim1xgodpw3ft1/branch/master?svg=true)](https://ci.appveyor.com/project/sounisi5011/metalsmith-pug-extra/branch/master)
[![Maintainability](https://api.codeclimate.com/v1/badges/f8efa3c8c8bc40f9da37/maintainability)](https://codeclimate.com/github/sounisi5011/metalsmith-pug-extra/maintainability)

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

| Name               | Type                           | Required | Default        | Details                                              |
| ------------------ | ------------------------------ | -------- | -------------- | ---------------------------------------------------- |
| **`pattern`**      | `string \| string[]`            | `✖`      | `['**/*.pug']` | Only files that match this pattern will be processed |
| **`renamer`**      | `(filename: string) => string` | `✖`      | `filename => filename.replace(/\.(?:pug\|jade)$/, '.html')` | Change the file name |
| **`overwrite`**    | `boolean`                      | `✖`      | `true`         | Overwrite duplicate files |
| **`copyFileData`** | `boolean`                      | `✖`      | `false`        | Copy the data of the file before conversion to the file after conversion |
| **`locals`**       | `Object`                       | `✖`      | `{}`           | Pass additional locals to the template                  |
| **`useMetadata`**  | `boolean`                      | `✖`      | `false`        | Expose [Metalsmith's global metadata](https://metalsmith.io/#-metadata-json-) and file data to the [Pug] template |

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

### `render(options?)`

#### Options

Converts a file processed by the `compile()` plugin from template to HTML.

| Name               | Type                           | Required | Default        | Details                                              |
| ------------------ | ------------------------------ | -------- | -------------- | ---------------------------------------------------- |
| **`locals`**       | `Object`                       | `✖`      | `{}`           | Pass additional locals to the template                  |
| **`useMetadata`**  | `boolean`                      | `✖`      | `false`        | Expose [Metalsmith's global metadata](https://metalsmith.io/#-metadata-json-) and file data to the [Pug] template |
