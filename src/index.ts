import Metalsmith from 'metalsmith';
import match from 'multimatch';
import pug from 'pug';

function isObject(value: unknown): value is { [index: string]: unknown } {
    return typeof value === 'object' && value !== null;
}

interface File {
    contents: Buffer;
    [index: string]: unknown;
}

function isFile(value: unknown): value is File {
    if (isObject(value)) {
        return (
            value.hasOwnProperty('contents') && Buffer.isBuffer(value.contents)
        );
    }
    return false;
}

interface Options {
    pattern: string | string[];
    renamer: (filename: string) => string;
    locals: pug.LocalsObject;
    /** @see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/pug/index.d.ts#L28 */
    filters: unknown;
    useMetadata: boolean;
    pugOptions: pug.Options;
}

function addFile(
    files: Metalsmith.Files,
    filename: string,
    contents: string,
): File {
    const newFile = {
        contents: Buffer.from(contents, 'utf8'),
        mode: '0644',
    };
    files[filename] = newFile;
    return newFile;
}

async function render(
    filename: string,
    files: Metalsmith.Files,
    metalsmith: Metalsmith,
    options: Options,
): Promise<void> {
    const data: unknown = files[filename];
    if (!isFile(data)) {
        return;
    }

    const locals: pug.LocalsObject = options.useMetadata
        ? {
              ...options.locals,
              ...metalsmith.metadata(),
              ...data,
          }
        : options.locals;
    const pugOptions: pug.Options = {
        ...options.pugOptions,
        filename: metalsmith.path(metalsmith.source(), filename),
    };
    const filters = options.filters;
    if (isObject(filters)) {
        Object.keys(filters).forEach(filter => {
            if (isObject(pugOptions.filters)) {
                pugOptions.filters[filter] = filters[filter];
            } else {
                pugOptions.filters = {
                    [filter]: filters[filter],
                };
            }
        });
    }
    const convertedText: string = pug.compile(
        data.contents.toString(),
        pugOptions,
    )(locals);

    const newFilename: string = options.renamer(filename);
    addFile(files, newFilename, convertedText);

    delete files[filename];
}

const convertDefaultOptions: Options = {
    pattern: ['**/*.pug'],
    renamer: filename => filename.replace(/\.(?:pug|jade)$/, '.html'),
    locals: {},
    filters: {},
    useMetadata: false,
    pugOptions: {},
};

export default function convert(
    opts: Partial<Options> = {},
): Metalsmith.Plugin {
    const options: Options = {
        ...convertDefaultOptions,
        ...opts,
    };

    return (files, metalsmith, done) => {
        const matchedFiles: string[] = match(
            Object.keys(files),
            options.pattern,
        );

        Promise.all(
            matchedFiles.map(filename =>
                render(filename, files, metalsmith, options),
            ),
        )
            .then(() => done(null, files, metalsmith))
            .catch(error => done(error, files, metalsmith));
    };
}

convert.defaultOptions = { ...convertDefaultOptions };
