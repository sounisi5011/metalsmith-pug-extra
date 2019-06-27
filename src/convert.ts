import createDebug from 'debug';
import deepFreeze from 'deep-freeze-strict';

import {
    compileDefaultOptions,
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
import { DeepReadonly } from './utils/deep-readonly';

const debug = createDebug('metalsmith-pug-extra:convert');

/*
 * Interfaces
 */

export type ConvertOptionsInterface = DeepReadonly<
    WritableConvertOptionsInterface
>;

interface WritableConvertOptionsInterface
    extends WritableCompileOptionsInterface,
        Omit<WritableRenderOptionsInterface, 'pattern'> {}

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

    return createEachPlugin((filename, files, metalsmith) => {
        const { pattern, otherOptions } = getRenderOptions(options);
        const compileOptions = { ...otherOptions, pattern };
        const { compileTemplate, newFilename, data } = getCompileTemplate(
            filename,
            files,
            metalsmith,
            compileOptions,
        );

        if (compileTemplate && newFilename && data) {
            debug(`converting ${filename}`);

            const convertedText = getRenderedText(
                compileTemplate,
                filename,
                data,
                metalsmith,
                options,
            );

            addFile(
                files,
                newFilename,
                convertedText,
                options.copyFileData ? data : undefined,
            );

            if (filename !== newFilename) {
                debug(`done convert ${filename}, renamed to ${newFilename}`);
                delete files[filename];
                debug(`file deleted: ${filename}`);
            } else {
                debug(`done convert ${filename}`);
            }
        }
    }, options.pattern);
}, convertDefaultOptions);
