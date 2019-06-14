import Metalsmith from 'metalsmith';
import match from 'multimatch';

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

export function isFile(value: unknown): value is FileInterface {
    if (isObject(value)) {
        return (
            value.hasOwnProperty('contents') && Buffer.isBuffer(value.contents)
        );
    }
    return false;
}

export function addFile(
    files: Metalsmith.Files,
    filename: string,
    contents: string,
): FileInterface {
    const newFile = {
        contents: Buffer.from(contents, 'utf8'),
        mode: '0644',
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
