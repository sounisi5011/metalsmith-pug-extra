import createDebug from 'debug';
import deepFreeze from 'deep-freeze-strict';
import isUtf8 from 'is-utf8';
import Metalsmith from 'metalsmith';
import pug from 'pug';

import compileTemplateMap from './compileTemplateMap';
import {
    addFile,
    createEachPlugin,
    createPluginGeneratorWithPugOptions,
    FileInterface,
    findEqualsPath,
    isFile,
} from './utils';
import { DeepReadonly } from './utils/types';

const debug = createDebug('metalsmith-pug-extra:compile');

/*
 * Interfaces
 */

export type CompileOptionsInterface = DeepReadonly<
    WritableCompileOptionsInterface
>;

export interface WritableCompileOptionsInterface {
    pattern: string | string[];
    renamer: (filename: string) => string;
    overwrite: boolean;
    copyFileData: boolean;
}

/*
 * Utility functions
 */

export function getCompileOptions<T extends CompileOptionsInterface>(
    options: T,
): CompileOptionsInterface & {
    otherOptions: Omit<T, keyof CompileOptionsInterface>;
} {
    const {
        pattern,
        renamer,
        overwrite,
        copyFileData,
        ...otherOptions
    } = options;
    return { pattern, renamer, overwrite, copyFileData, otherOptions };
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
    debug(`validating ${filename}`);

    const data: unknown = files[filename];
    if (!isFile(data)) {
        debug(`validation failed, ${filename} is not valid file data`);
        return {};
    }

    if (!isUtf8(data.contents)) {
        debug(`validation failed, ${filename} is not utf-8`);
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
        debug(`compile failed, ${filename} is duplicated of ${dupFilename}`);
        return {};
    }

    pugOptions.filename = absoluteFilepath;

    debug(`compiling ${filename}`);
    const compileTemplate = pug.compile(data.contents.toString(), pugOptions);
    debug(`done compile ${filename}`);

    return { compileTemplate, newFilename: dupFilename || newFilename, data };
}

/*
 * Default options
 */

export const compileDefaultOptions: CompileOptionsInterface = deepFreeze({
    pattern: ['**/*.pug'],
    renamer: filename => filename.replace(/\.(?:pug|jade)$/, '.html'),
    overwrite: true,
    copyFileData: false,
});

/*
 * Main function
 */

export const compile = createPluginGeneratorWithPugOptions((opts = {}) => {
    const options = {
        ...compileDefaultOptions,
        ...opts,
    };

    return createEachPlugin((filename, files, metalsmith) => {
        const { compileTemplate, newFilename, data } = getCompileTemplate(
            filename,
            files,
            metalsmith,
            options,
        );
        if (compileTemplate && newFilename) {
            const newFile = addFile(
                files,
                newFilename,
                '',
                options.copyFileData ? data : undefined,
            );
            debug(`file created: ${newFilename}`);
            compileTemplateMap.set(newFile, compileTemplate);

            if (filename !== newFilename) {
                delete files[filename];
                debug(`file deleted: ${filename}`);
            }
        }
    }, options.pattern);
}, compileDefaultOptions);
