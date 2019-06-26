import { ExecutionContext } from 'ava';
import fs from 'fs';
import Metalsmith from 'metalsmith';
import path from 'path';
import slug from 'slug';
import util from 'util';

import { isFile, isObject } from '../../src/utils';

const TEST_DIR_PATH = path.resolve(__dirname, '..');

export function sleep(sec: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

export function ignoreTypeError(callback: () => void): void {
    try {
        callback();
    } catch (error) {
        if (!(error instanceof TypeError)) {
            throw error;
        }
    }
}

export function objIgnoreKeys<T>(obj: T, keyList: string[]): T {
    if (isObject(obj)) {
        // @ts-ignore: TS2322
        const newObj: T = {};
        return Object.entries(obj)
            .filter(([key]) => !keyList.includes(key))
            .reduce((obj, [key, value]) => {
                // @ts-ignore: TS7053
                obj[key] = value;
                return obj;
            }, newObj);
    }
    return obj;
}

const destDirSet = new Set();
export function getDestDir(t: ExecutionContext, namespace?: string): string {
    const dirName = slug(t.title, slug.defaults.modes['rfc3986']);
    const dirpath = namespace ? path.join(dirName, namespace) : dirName;
    if (destDirSet.has(dirpath)) {
        throw new Error(`Duplicate test dir: ${dirpath}`);
    }
    destDirSet.add(dirpath);
    return dirpath;
}

export function createMetalsmith(
    t: ExecutionContext,
    destNamespace?: string,
    subNamespace?: string,
): Metalsmith {
    return Metalsmith(path.join(TEST_DIR_PATH, 'fixtures'))
        .source('pages')
        .destination(
            path.join(
                'build',
                ...(destNamespace ? [destNamespace] : []),
                getDestDir(t, subNamespace),
            ),
        )
        .clean(true);
}

export function generateMetalsmithCreator(
    testFilepath: string,
): (t: ExecutionContext, subNamespace?: string) => Metalsmith {
    const namespace = path
        .relative(TEST_DIR_PATH, path.resolve(testFilepath))
        .replace(/\.(?:js|ts)$/, '');
    return (t, subNamespace) => {
        return createMetalsmith(t, namespace, subNamespace);
    };
}

export function destPath(metalsmith: Metalsmith, ...paths: string[]): string {
    return path.join(
        path.relative(process.cwd(), metalsmith.destination()),
        ...paths,
    );
}

export async function readSourceFile(
    metalsmith: Metalsmith,
    filename: string,
): Promise<string> {
    const readFile = util.promisify(fs.readFile);
    const sourceFilepath = metalsmith.path(metalsmith.source(), filename);
    return (await readFile(sourceFilepath)).toString();
}

export function getFileContentsPlugin(
    filename: string,
    callback: (contents: string | undefined) => void | Promise<void>,
): Metalsmith.Plugin {
    return (files, metalsmith, done) => {
        (async () => {
            const targetFileData = files[filename];

            if (targetFileData === undefined) {
                throw ReferenceError(
                    `not found in metalsmith/files: ${filename}`,
                );
            }

            if (isFile(targetFileData)) {
                await callback(targetFileData.contents.toString());
            } else {
                await callback(undefined);
            }

            done(null, files, metalsmith);
        })();
    };
}

export function setLocalsPlugin(locals: {
    [index: string]: unknown;
}): Metalsmith.Plugin {
    return (files, metalsmith, done) => {
        Object.values(files).forEach(file => {
            Object.assign(file, locals);
        });
        done(null, files, metalsmith);
    };
}

export function assertFileExists(
    t: ExecutionContext,
    filepath: string,
): Promise<void> {
    return new Promise(resolve => {
        fs.stat(filepath, err => {
            t.falsy(err, 'File exist');
            resolve();
        });
    });
}

export function assertFileNotExists(
    t: ExecutionContext,
    filepath: string,
): Promise<void> {
    return new Promise(resolve => {
        fs.stat(filepath, err => {
            t.truthy(err, 'File does not exist');
            resolve();
        });
    });
}

export function assertFileContentsEquals(
    t: ExecutionContext,
    filepath: string,
    contents: string,
): Promise<void> {
    return new Promise(resolve => {
        fs.readFile(filepath, (err, data) => {
            t.falsy(err, 'No readFile error');

            if (!err) {
                t.is(data.toString(), contents, filepath);
            }

            resolve();
        });
    });
}

export function assertMetalsmithBuild({
    t,
    metalsmith,
}: {
    t: ExecutionContext;
    metalsmith: Metalsmith;
}): Promise<void> {
    return new Promise(resolve => {
        metalsmith.build(err => {
            t.is(err, null, 'No build error');
            resolve();
        });
    });
}

export async function assertFileConverted({
    t,
    metalsmith,
    sourceFilename,
    destFilename,
    destFileContents,
}: {
    t: ExecutionContext;
    metalsmith: Metalsmith;
    sourceFilename?: string;
    destFilename: string;
    destFileContents: string;
}): Promise<void> {
    await assertMetalsmithBuild({
        t,
        metalsmith,
    });
    await assertFileContentsEquals(
        t,
        destPath(metalsmith, destFilename),
        destFileContents,
    );
    if (sourceFilename && sourceFilename !== destFilename) {
        await assertFileNotExists(t, destPath(metalsmith, sourceFilename));
    }
}

export async function assertFileNotConverted({
    t,
    metalsmith,
    sourceFilename,
    destFilename,
}: {
    t: ExecutionContext;
    metalsmith: Metalsmith;
    sourceFilename: string;
    destFilename: string;
}): Promise<void> {
    await assertMetalsmithBuild({
        t,
        metalsmith,
    });
    await assertFileNotExists(t, destPath(metalsmith, destFilename));
    await assertFileExists(t, destPath(metalsmith, sourceFilename));
}

export function assertFilesPlugin(
    t: ExecutionContext,
    fileNameList: string[],
    message?: string,
): Metalsmith.Plugin {
    return (files, metalsmith, done) => {
        t.deepEqual(Object.keys(files).sort(), fileNameList.sort(), message);
        done(null, files, metalsmith);
    };
}
