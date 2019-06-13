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

interface Options extends pug.Options {
    pattern: string | string[];
    renamer: (filename: string) => string;
    locals: pug.LocalsObject;
    useMetadata: boolean;
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

    const {
        pattern, // eslint-disable-line no-unused-vars, @typescript-eslint/no-unused-vars
        renamer,
        locals,
        useMetadata,
        ...otherOpts
    } = options;

    if (useMetadata) {
        Object.assign(locals, metalsmith.metadata(), data);
    }

    const pugOptions: pug.Options = {
        ...otherOpts,
        filename: metalsmith.path(metalsmith.source(), filename),
    };

    const convertedText: string = pug.compile(
        data.contents.toString(),
        pugOptions,
    )(locals);

    const newFilename: string = renamer(filename);
    addFile(files, newFilename, convertedText);

    if (filename !== newFilename) {
        delete files[filename];
    }
}

const convertDefaultOptions: Options = {
    pattern: ['**/*.pug'],
    renamer: filename => filename.replace(/\.(?:pug|jade)$/, '.html'),
    locals: {},
    useMetadata: false,
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
