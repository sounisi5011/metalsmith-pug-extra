import Metalsmith from 'metalsmith';
import pug from 'pug';
import deepFreeze from 'deep-freeze-strict';
import createDebug from 'debug';

import { addFile, freezeProperty, createEachPlugin } from './utils';
import {
    CompileOptionsInterface,
    compileDefaultOptions,
    getCompileTemplate,
} from './compile';
import {
    RenderOptionsInterface,
    renderDefaultOptions,
    getRenderOptions,
    getRenderedText,
} from './render';

const debug = createDebug('metalsmith-pug-extra:convert');

interface ConvertOptionsInterface
    extends CompileOptionsInterface,
        RenderOptionsInterface {}

interface ConvertFuncInterface {
    (
        options?: Partial<ConvertOptionsInterface> & pug.Options,
    ): Metalsmith.Plugin;
    defaultOptions: ConvertOptionsInterface;
}

const convertDefaultOptions: ConvertOptionsInterface = deepFreeze({
    ...compileDefaultOptions,
    ...renderDefaultOptions,
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const convert: ConvertFuncInterface = function(opts = {}) {
    const options = {
        ...convertDefaultOptions,
        ...opts,
    };

    return createEachPlugin((filename, files, metalsmith) => {
        const { otherOptions: compileOptions } = getRenderOptions(options);
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

            addFile(files, newFilename, convertedText);

            if (filename !== newFilename) {
                debug(`done convert ${filename}, renamed to ${newFilename}`);
                delete files[filename];
                debug(`file deleted: ${filename}`);
            } else {
                debug(`done convert ${filename}`);
            }
        }
    }, options.pattern);
};

convert.defaultOptions = convertDefaultOptions;
freezeProperty(convert, 'defaultOptions');
