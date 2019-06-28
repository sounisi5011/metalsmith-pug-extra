import Metalsmith from 'metalsmith';
import match from 'multimatch';
import path from 'path';
import pug from 'pug';

import { DeepReadonly, isReadonlyOrWritableArray } from './utils/types';

export interface FileInterface {
    contents: Buffer;
    [index: string]: unknown;
}

export function isObject(
    value: unknown,
): value is { [index: string]: unknown } {
    return typeof value === 'object' && value !== null;
}

export function freezeProperty(obj: object, prop: string): void {
    Object.defineProperty(obj, prop, { configurable: false, writable: false });
}

export function createPluginGenerator<T>(
    func: (options?: Partial<T>) => Metalsmith.Plugin,
    defaultOptions: T,
): {
    (options?: Partial<T>): Metalsmith.Plugin;
    readonly defaultOptions: T;
} {
    const newFunc = Object.assign(func, { defaultOptions });
    freezeProperty(newFunc, 'defaultOptions');
    return newFunc;
}

export const createPluginGeneratorWithPugOptions: <T>(
    func: (options?: Partial<T> & pug.Options) => Metalsmith.Plugin,
    defaultOptions: T,
) => {
    (options?: Partial<T> & pug.Options): Metalsmith.Plugin;
    readonly defaultOptions: T;
} = createPluginGenerator;

export function isFile(value: unknown): value is FileInterface {
    if (isObject(value)) {
        return (
            value.hasOwnProperty('contents') && Buffer.isBuffer(value.contents)
        );
    }
    return false;
}

export function findEqualsPath(
    baseDirpath: string,
    filepath: string,
    pathList: string[],
): string | undefined {
    const absoluteFilepath = path.resolve(baseDirpath, filepath);
    return pathList.find(
        targetPath =>
            path.resolve(baseDirpath, targetPath) === absoluteFilepath,
    );
}

export function addFile(
    files: Metalsmith.Files,
    filename: string,
    contents: string,
    originalData?: FileInterface,
): FileInterface {
    const newFile = {
        mode: '0644',
        ...originalData,
        contents: Buffer.from(contents, 'utf8'),
    };
    files[filename] = newFile;
    return newFile;
}

export function getMatchedFiles(
    files: Metalsmith.Files,
    pattern: DeepReadonly<string | string[] | undefined>,
): string[] {
    const matchPatterns = (Array.isArray as isReadonlyOrWritableArray)(pattern)
        ? [...pattern]
        : pattern;
    const matchedFiles =
        matchPatterns !== undefined
            ? match(Object.keys(files), matchPatterns)
            : Object.keys(files);
    return matchedFiles;
}

export function createEachPlugin(
    callback: (
        filename: string,
        files: Metalsmith.Files,
        metalsmith: Metalsmith,
    ) => void | Promise<void>,
    pattern?: DeepReadonly<string | string[]>,
): Metalsmith.Plugin {
    return (files, metalsmith, done) => {
        const matchedFiles = getMatchedFiles(files, pattern);

        Promise.all(
            matchedFiles.map(filename => callback(filename, files, metalsmith)),
        )
            .then(() => done(null, files, metalsmith))
            .catch(error => done(error, files, metalsmith));
    };
}
