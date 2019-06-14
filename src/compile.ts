import Metalsmith from 'metalsmith';
import pug from 'pug';
import isUtf8 from 'is-utf8';
import deepFreeze from 'deep-freeze-strict';

import {
    FileInterface,
    isFile,
    addFile,
    findEqualsPath,
    freezeProperty,
    createEachPlugin,
} from './utils';
import compileTemplateMap from './compileTemplateMap';

export interface CompileOptionsInterface {
    pattern: string | string[];
    renamer: (filename: string) => string;
    overwrite: boolean;
}

export function getCompileOptions<T extends CompileOptionsInterface>(
    options: T,
): CompileOptionsInterface & {
    otherOptions: Omit<T, keyof CompileOptionsInterface>;
} {
    const { pattern, renamer, overwrite, ...otherOptions } = options;
    return { pattern, renamer, overwrite, otherOptions };
}

export function getCompileTemplate(
    filename: string,
    files: Metalsmith.Files,
    metalsmith: Metalsmith,
    options: CompileOptionsInterface & pug.Options,
): {
    compileTemplate?: pug.compileTemplate;
    newFilename?: string;
    data?: FileInterface;
} {
    const data: unknown = files[filename];
    if (!isFile(data)) {
        return {};
    }

    if (!isUtf8(data.contents)) {
        return {};
    }

    const { renamer, overwrite, otherOptions: pugOptions } = getCompileOptions(
        options,
    );
    const newFilename: string = renamer(filename);

    const absoluteFilepath = metalsmith.path(metalsmith.source(), filename);
    const dupFilename = findEqualsPath(
        metalsmith.path(metalsmith.destination()),
        newFilename,
        Object.keys(files),
    );

    if (!overwrite && dupFilename) {
        return {};
    }

    pugOptions.filename = absoluteFilepath;

    const compileTemplate = pug.compile(data.contents.toString(), pugOptions);

    return { compileTemplate, newFilename: dupFilename || newFilename, data };
}

export const compileDefaultOptions: CompileOptionsInterface = deepFreeze({
    pattern: ['**/*.pug'],
    renamer: filename => filename.replace(/\.(?:pug|jade)$/, '.html'),
    overwrite: true,
});

export interface CompileFuncInterface {
    (
        options?: Partial<CompileOptionsInterface> & pug.Options,
    ): Metalsmith.Plugin;
    defaultOptions: CompileOptionsInterface;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const compile: CompileFuncInterface = function(opts = {}) {
    const options = {
        ...compileDefaultOptions,
        ...opts,
    };

    return createEachPlugin((filename, files, metalsmith) => {
        const { compileTemplate, newFilename } = getCompileTemplate(
            filename,
            files,
            metalsmith,
            options,
        );
        if (compileTemplate && newFilename) {
            const newFile = addFile(files, newFilename, '');
            compileTemplateMap.set(newFile.contents, compileTemplate);

            if (filename !== newFilename) {
                delete files[filename];
            }
        }
    }, options.pattern);
};

compile.defaultOptions = compileDefaultOptions;
freezeProperty(compile, 'defaultOptions');
