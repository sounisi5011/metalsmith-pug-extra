import createDebug from 'debug';
import deepFreeze from 'deep-freeze-strict';
import Metalsmith from 'metalsmith';
import pug from 'pug';

import {
    compileDefaultOptions,
    CompileOptionsInterface,
    getCompileTemplate,
} from './compile';
import {
    getRenderedText,
    getRenderOptions,
    renderDefaultOptions,
    RenderOptionsInterface,
} from './render';
import { addFile, createEachPlugin, defDefaultOptions } from './utils';

const debug = createDebug('metalsmith-pug-extra:convert');

/*
 * Interfaces
 */

interface ConvertFuncInterface {
    (
        options?: Partial<ConvertOptionsInterface> & pug.Options,
    ): Metalsmith.Plugin;
    readonly defaultOptions: ConvertOptionsInterface;
}

interface ConvertOptionsInterface
    extends CompileOptionsInterface,
        Omit<RenderOptionsInterface, 'pattern'> {}

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

export const convert = defDefaultOptions(
    <ConvertFuncInterface>((opts = {}) => {
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
                    debug(
                        `done convert ${filename}, renamed to ${newFilename}`,
                    );
                    delete files[filename];
                    debug(`file deleted: ${filename}`);
                } else {
                    debug(`done convert ${filename}`);
                }
            }
        }, options.pattern);
    }),
    convertDefaultOptions,
);
