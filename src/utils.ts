import Metalsmith from 'metalsmith';
import match from 'multimatch';
import path from 'path';

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

export function defDefaultOptions<
    T extends (options: any) => any, // eslint-disable-line @typescript-eslint/no-explicit-any
    U extends Parameters<T>[0]
>(func: T, defaultOptions: U): T & { readonly defaultOptions: U } {
    const newFunc = Object.assign(func, { defaultOptions });
    freezeProperty(newFunc, 'defaultOptions');
    return newFunc;
}

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

export function createEachPlugin(
    callback: (
        filename: string,
        files: Metalsmith.Files,
        metalsmith: Metalsmith,
    ) => void | Promise<void>,
    pattern?: string | string[],
): Metalsmith.Plugin {
    return (files, metalsmith, done) => {
        const matchedFiles: string[] =
            pattern !== undefined
                ? match(Object.keys(files), pattern)
                : Object.keys(files);

        Promise.all(
            matchedFiles.map(filename => callback(filename, files, metalsmith)),
        )
            .then(() => done(null, files, metalsmith))
            .catch(error => done(error, files, metalsmith));
    };
}
