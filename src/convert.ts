import createDebug from 'debug';
import deepFreeze from 'deep-freeze-strict';
import Metalsmith from 'metalsmith';
import pug from 'pug';

import {
    compileDefaultOptions,
    CompileOptionsInterface,
    getCompileOptions,
    getCompileTemplate,
} from './compile';
import {
    getRenderedText,
    getRenderOptions,
    renderDefaultOptions,
    RenderOptionsInterface,
} from './render';
import { addFile, createEachPlugin, freezeProperty } from './utils';

const debug = createDebug('metalsmith-pug-extra:convert');

/*
 * Interfaces
 */

interface ConvertFuncInterface {
    (
        options?: Partial<ConvertOptionsInterface> & pug.Options,
    ): Metalsmith.Plugin;
    defaultOptions: ConvertOptionsInterface;
}

interface ConvertOptionsInterface
    extends CompileOptionsInterface,
        Omit<RenderOptionsInterface, 'pattern' | 'reuse'> {}

/*
 * Default options
 */

const convertDefaultOptions: ConvertOptionsInterface = deepFreeze({
    ...compileDefaultOptions,
    locals: renderDefaultOptions.locals,
    useMetadata: renderDefaultOptions.useMetadata,
});

/*
 * Main function
 */

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const convert: ConvertFuncInterface = function(opts = {}) {
    const options = {
        ...convertDefaultOptions,
        ...opts,
    };
    const { otherOptions, ...compileOptions } = getCompileOptions(options);
    const { otherOptions: pugOptions, ...renderOptions } = getRenderOptions({
        ...renderDefaultOptions,
        ...otherOptions,
    });
    const compileAndPugOptions = { ...compileOptions, ...pugOptions };

    return createEachPlugin((filename, files, metalsmith) => {
        const { compileTemplate, newFilename, data } = getCompileTemplate(
            filename,
            files,
            metalsmith,
            compileAndPugOptions,
        );

        if (compileTemplate && newFilename && data) {
            debug(`converting ${filename}`);

            const convertedText = getRenderedText(
                compileTemplate,
                filename,
                data,
                metalsmith,
                renderOptions,
            );

            addFile(
                files,
                newFilename,
                convertedText,
                compileOptions.copyFileData ? data : undefined,
            );

            if (filename !== newFilename) {
                debug(`done convert ${filename}, renamed to ${newFilename}`);
                delete files[filename];
                debug(`file deleted: ${filename}`);
            } else {
                debug(`done convert ${filename}`);
            }
        }
    }, compileOptions.pattern);
};

convert.defaultOptions = convertDefaultOptions;
freezeProperty(convert, 'defaultOptions');
