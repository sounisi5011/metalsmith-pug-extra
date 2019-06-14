import Metalsmith from 'metalsmith';
import match from 'multimatch';
import pug from 'pug';
import deepFreeze from 'deep-freeze-strict';

import { addFile, freezeProperty } from './utils';
import {
    CompileOptionsInterface,
    compileDefaultOptions,
    getCompileTemplate,
} from './compile';
import {
    RenderOptionsInterface,
    renderDefaultOptions,
    getConvertedText,
    getRenderOptions,
} from './render';

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

    return (files, metalsmith, done) => {
        const matchedFiles: string[] = match(
            Object.keys(files),
            options.pattern,
        );

        Promise.all(
            matchedFiles.map(filename => {
                const { otherOptions: compileOptions } = getRenderOptions(
                    options,
                );
                const {
                    compileTemplate,
                    newFilename,
                    data,
                } = getCompileTemplate(
                    filename,
                    files,
                    metalsmith,
                    compileOptions,
                );

                if (compileTemplate && newFilename && data) {
                    const convertedText = getConvertedText(
                        compileTemplate,
                        data,
                        metalsmith,
                        options,
                    );

                    addFile(files, newFilename, convertedText);

                    if (filename !== newFilename) {
                        delete files[filename];
                    }
                }
            }),
        )
            .then(() => done(null, files, metalsmith))
            .catch(error => done(error, files, metalsmith));
    };
};

convert.defaultOptions = convertDefaultOptions;
freezeProperty(convert, 'defaultOptions');
