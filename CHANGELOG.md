# Change Log

## [Unreleased]

### Updated Dependencies

#### devDependencies

* `@typescript-eslint/eslint-plugin`
    * [#68] - `1.12.0` -> `1.13.0`
* `@typescript-eslint/parser`
    * [#68] - `1.12.0` -> `1.13.0`
* `husky`
    * [#66] - `3.0.0` -> `3.0.1`

[Unreleased]: https://github.com/sounisi5011/metalsmith-pug-extra/compare/v1.1.1...HEAD
[#66]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/66
[#68]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/68

## [1.1.1] (2019-07-15)

### Supported Node version

`8.10.0 - 8.x || 10.0.0 - x.x` -> `8.3.0 - x.x`

* [#54] - Update dependency ava to v2.2.0
* [#52] - Update dependency lint-staged to v9
* [#64] - Downgrade supported Node version

### Updated Dependencies

#### devDependencies

* `@typescript-eslint/eslint-plugin`
    * [#61] - `1.11.0` -> `1.12.0`
* `@typescript-eslint/parser`
    * [#61] - `1.11.0` -> `1.12.0`
* `ava`
    * [#54] - `2.1.0` -> `2.2.0`
* `husky`
    * [#53] - `2.7.0` -> `3.0.0`
* `lint-staged`
    * [#52] - `8.2.1` -> `9.2.0`
* `semver`
    * [#51] - `6.1.2` -> `6.2.0`
* `typescript`
    * [#55] - `3.5.2` -> `3.5.3`

### Added Dependencies

#### devDependencies

* [#59] - `sounisi5011/check-peer-deps`
* [#60] - `package-version-git-tag@1.0.0`

### Tests

* [#59] - Check peerDependencies

### Others

* [#60] - Replace build script `script/git-add-pkg-version-tag.ts` with package-version-git-tag package.
* [#63] - Yarn to npm

[1.1.1]: https://github.com/sounisi5011/metalsmith-pug-extra/compare/v1.1.0...v1.1.1
[#51]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/51
[#52]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/52
[#53]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/53
[#54]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/54
[#55]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/55
[#59]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/59
[#60]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/60
[#61]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/61
[#63]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/63
[#64]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/64

## [1.1.0] (2019-06-29 UTC / 2019-06-30 JST)

### Features

* [#31] - `pattern` option of `render()` function
* [#41] - `reuse` option of `render()` function
* [#44] - Type definition of `defaultOptions` property is readonly

### Supported Node version

`8.15.0 - x.x` -> `8.10.0 - 8.x || 10.0.0 - x.x`

* [#38] - Downgrade supported Node version

### Updated Dependencies

#### dependencies

* `pug`
    * [#26] - `2.0.3` -> `2.0.4`

#### devDependencies

* `@typescript-eslint/eslint-plugin`
    * [#32] - `1.10.2` -> `1.11.0`
* `@typescript-eslint/parser`
    * [#32] - `1.10.2` -> `1.11.0`
* `eslint-config-prettier`
    * [#37] - `5.0.0` -> `5.1.0`
    * [#40] - `5.1.0` -> `6.0.0`
* `eslint-plugin-import`
    * [#36] - `2.17.3` -> `2.18.0`
* `eslint-plugin-promise`
    * [#39] - `4.1.1` -> `4.2.1`
* `eslint-plugin-simple-import-sort`
    * [#27] - `3.1.1` -> `4.0.0`
* `husky`
    * [#34] - `2.4.1` -> `2.5.0`
    * [#42] - `2.5.0` -> `2.7.0`

### Added Dependencies

#### devDependencies

* [#45] - `@types/node@*`
* [#38] - `@types/recursive-readdir@2.2.0`
* [#38] - `@types/semver@6.0.1`
* [#33] - `@types/slug@0.9.1`
* [#45] - `can-npm-publish@1.3.1`
* [#45] - `del-cli@2.0.0`
* [#45] - `git-branch-is@2.1.0`
* [#45] - `is-git-status-clean@1.0.0`
* [#38] - `recursive-readdir@2.2.2`
* [#38] - `semver@6.1.2`
* [#33] - `slug@1.1.0`

### Tests

* [#30] - Remove CRLF correspondence from test code
* [#33] - Migration to parallel test

### Others

* [#22] - Fix CHANGELOG's URL
* [#45] - Add publish npm-scripts
* [#46] - Add format npm-scripts

[1.1.0]: https://github.com/sounisi5011/metalsmith-pug-extra/compare/v1.0.1...v1.1.0
[#22]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/22
[#26]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/26
[#27]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/27
[#30]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/30
[#31]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/31
[#32]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/32
[#33]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/33
[#34]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/34
[#36]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/36
[#37]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/37
[#38]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/38
[#39]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/39
[#40]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/40
[#41]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/41
[#42]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/42
[#44]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/44
[#45]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/45
[#46]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/46

## [1.0.1] (2019-06-16)

[1.0.1]: https://github.com/sounisi5011/metalsmith-pug-extra/compare/v1.0.0...v1.0.1

### Bug Fixes

* HTML should be rendered even if the contents field is changed Issue [#19] / PR [#20] ([7ccb5f5])

[#19]: https://github.com/sounisi5011/metalsmith-pug-extra/issues/19
[#20]: https://github.com/sounisi5011/metalsmith-pug-extra/pull/20
[7ccb5f5]: https://github.com/sounisi5011/metalsmith-pug-extra/commit/7ccb5f5409b118a420182094bd8cdc04154ed8f1

## [1.0.0] (2019-06-16)

[1.0.0]: https://github.com/sounisi5011/metalsmith-pug-extra/compare/20f6a8ac62940b16018feb09b1ad88be024eeec1...v1.0.0
