import Metalsmith from 'metalsmith';

export interface FileInterface {
    contents: Buffer;
    [index: string]: unknown;
}

export function isObject(
    value: unknown,
): value is { [index: string]: unknown } {
    return typeof value === 'object' && value !== null;
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
