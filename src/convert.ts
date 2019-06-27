import createDebug from 'debug';
import deepFreeze from 'deep-freeze-strict';

import {
    compileDefaultOptions,
    getCompileOptions,
    getCompileTemplate,
    WritableCompileOptionsInterface,
} from './compile';
import {
    getRenderedText,
    getRenderOptions,
    renderDefaultOptions,
    WritableRenderOptionsInterface,
} from './render';
import {
    addFile,
    createEachPlugin,
    createPluginGeneratorWithPugOptions,
} from './utils';
import { DeepReadonly } from './utils/types';

const debug = createDebug('metalsmith-pug-extra:convert');

/*
 * Interfaces
 */

export type ConvertOptionsInterface = DeepReadonly<
    WritableConvertOptionsInterface
>;

interface WritableConvertOptionsInterface
    extends WritableCompileOptionsInterface,
        Omit<WritableRenderOptionsInterface, 'pattern' | 'reuse'> {}

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

export const convert = createPluginGeneratorWithPugOptions((opts = {}) => {
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
}, convertDefaultOptions);
