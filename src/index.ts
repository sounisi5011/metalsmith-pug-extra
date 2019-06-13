import Metalsmith from 'metalsmith';
import match from 'multimatch';
import pug from 'pug';
import isUtf8 from 'is-utf8';

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

interface CompileOptions {
    pattern: string | string[];
    renamer: (filename: string) => string;
}

interface CompileFunc {
    (options?: Partial<CompileOptions> & pug.Options): Metalsmith.Plugin;
    defaultOptions: CompileOptions;
}

interface RenderOptions {
    locals: pug.LocalsObject;
    useMetadata: boolean;
}

interface RenderFunc {
    (options?: Partial<RenderOptions>): Metalsmith.Plugin;
    defaultOptions: RenderOptions;
}

interface ConvertOptions extends CompileOptions, RenderOptions {}

interface ConvertFunc {
    (options?: Partial<ConvertOptions> & pug.Options): Metalsmith.Plugin;
    defaultOptions: ConvertOptions;
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

const compileTemplateMap: WeakMap<Buffer, pug.compileTemplate> = new WeakMap();

async function compileEach(
    filename: string,
    files: Metalsmith.Files,
    metalsmith: Metalsmith,
    options: CompileOptions & pug.Options,
): Promise<void> {
    const data: unknown = files[filename];
    if (!isFile(data)) {
        return;
    }

    if (!isUtf8(data.contents)) {
        return;
    }

    const {
        pattern, // eslint-disable-line no-unused-vars, @typescript-eslint/no-unused-vars
        renamer,
        ...otherOpts
    } = options;

    const pugOptions: pug.Options = {
        ...otherOpts,
        filename: metalsmith.path(metalsmith.source(), filename),
    };

    const compileTemplate = pug.compile(data.contents.toString(), pugOptions);

    const newFilename: string = renamer(filename);
    const newFile = addFile(files, newFilename, '');
    compileTemplateMap.set(newFile.contents, compileTemplate);

    if (filename !== newFilename) {
        delete files[filename];
    }
}

const compileDefaultOptions: CompileOptions = {
    pattern: ['**/*.pug'],
    renamer: filename => filename.replace(/\.(?:pug|jade)$/, '.html'),
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const compile: CompileFunc = function(opts = {}) {
    const options = {
        ...compileDefaultOptions,
        ...opts,
    };

    return (files, metalsmith, done) => {
        const matchedFiles: string[] = match(
            Object.keys(files),
            options.pattern,
        );

        Promise.all(
            matchedFiles.map(filename =>
                compileEach(filename, files, metalsmith, options),
            ),
        )
            .then(() => done(null, files, metalsmith))
            .catch(error => done(error, files, metalsmith));
    };
};

compile.defaultOptions = { ...compileDefaultOptions };

async function renderEach(
    filename: string,
    files: Metalsmith.Files,
    metalsmith: Metalsmith,
    options: RenderOptions,
): Promise<void> {
    const data: unknown = files[filename];
    if (!isFile(data)) {
        return;
    }

    const { locals, useMetadata } = options;

    if (useMetadata) {
        Object.assign(locals, metalsmith.metadata(), data);
    }

    const compileTemplate = compileTemplateMap.get(data.contents);
    if (compileTemplate) {
        const convertedText: string = compileTemplate(locals);
        data.contents = Buffer.from(convertedText, 'utf8');
    }
}

const renderDefaultOptions: RenderOptions = {
    locals: {},
    useMetadata: false,
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const render: RenderFunc = function(opts = {}) {
    const options = {
        ...renderDefaultOptions,
        ...opts,
    };

    return (files, metalsmith, done) => {
        Promise.all(
            Object.keys(files).map(filename =>
                renderEach(filename, files, metalsmith, options),
            ),
        )
            .then(() => done(null, files, metalsmith))
            .catch(error => done(error, files, metalsmith));
    };
};

render.defaultOptions = { ...renderDefaultOptions };

async function convertEach(
    filename: string,
    files: Metalsmith.Files,
    metalsmith: Metalsmith,
    options: ConvertOptions & pug.Options,
): Promise<void> {
    const data: unknown = files[filename];
    if (!isFile(data)) {
        return;
    }

    if (!isUtf8(data.contents)) {
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

const convertDefaultOptions: ConvertOptions = {
    ...compileDefaultOptions,
    ...renderDefaultOptions,
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const convert: ConvertFunc = function(opts = {}) {
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
            matchedFiles.map(filename =>
                convertEach(filename, files, metalsmith, options),
            ),
        )
            .then(() => done(null, files, metalsmith))
            .catch(error => done(error, files, metalsmith));
    };
};

convert.defaultOptions = { ...convertDefaultOptions };

export { compile, render };
export default convert;
