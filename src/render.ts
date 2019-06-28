import createDebug from 'debug';
import deepFreeze from 'deep-freeze-strict';
import cloneDeep from 'lodash.clonedeep';
import Metalsmith from 'metalsmith';
import pug from 'pug';

import compileTemplateMap from './compileTemplateMap';
import {
    createPluginGenerator,
    FileInterface,
    getMatchedFiles,
    isFile,
} from './utils';
import { DeepReadonly } from './utils/types';

const debug = createDebug('metalsmith-pug-extra:render');
const debugOptions = debug.extend('options');

/*
 * Interfaces
 */

export type RenderOptionsInterface = DeepReadonly<
    WritableRenderOptionsInterface
>;

export interface WritableRenderOptionsInterface {
    locals: pug.LocalsObject;
    useMetadata: boolean;
    pattern: string | string[];
    reuse: boolean;
}

/*
 * Utility functions
 */

const previousRenderOptionsMap: WeakMap<
    Metalsmith,
    Partial<RenderOptionsInterface>
> = new WeakMap();

export function normalizeRenderOptions(
    metalsmith: Metalsmith,
    options: Partial<RenderOptionsInterface>,
    defaultOptions: RenderOptionsInterface,
): RenderOptionsInterface {
    debugOptions('normalizing options: %o', options);

    const partialOptions = {};
    const mergedOptions = { ...defaultOptions, ...options };

    if (mergedOptions.reuse && previousRenderOptionsMap.has(metalsmith)) {
        const previousRenderOptions = previousRenderOptionsMap.get(metalsmith);
        debugOptions('reuse previous options: %o', previousRenderOptions);
        Object.assign(partialOptions, previousRenderOptions);
    }

    Object.assign(partialOptions, options);

    debugOptions('save current options: %o', partialOptions);
    previousRenderOptionsMap.set(metalsmith, partialOptions);

    const normalizedOptions = {
        ...defaultOptions,
        ...partialOptions,
    };
    debugOptions('normalized options: %o', normalizedOptions);

    return normalizedOptions;
}

export function getRenderOptions<T extends RenderOptionsInterface>(
    options: T,
): RenderOptionsInterface & {
    otherOptions: Omit<T, keyof RenderOptionsInterface>;
} {
    const { locals, useMetadata, pattern, reuse, ...otherOptions } = options;
    return { locals, useMetadata, pattern, reuse, otherOptions };
}

export function getRenderedText(
    compileTemplate: pug.compileTemplate,
    filename: string,
    data: FileInterface,
    metalsmith: Metalsmith,
    options: RenderOptionsInterface,
): string {
    const { locals, useMetadata } = getRenderOptions(options);
    const pugLocals = cloneDeep(
        useMetadata ? { ...locals, ...metalsmith.metadata(), ...data } : locals,
    );

    debug(`rendering ${filename}`);
    const convertedText = compileTemplate(pugLocals);
    debug(`done rendering ${filename}`);

    return convertedText;
}

/*
 * Default options
 */

export const renderDefaultOptions: RenderOptionsInterface = deepFreeze({
    locals: {},
    useMetadata: false,
    pattern: ['**/*'],
    reuse: false,
});

/*
 * Main function
 */

export const render = createPluginGenerator((opts = {}) => {
    return (files, metalsmith, done) => {
        const options = normalizeRenderOptions(
            metalsmith,
            opts,
            renderDefaultOptions,
        );

        getMatchedFiles(files, options.pattern).forEach(filename => {
            const data: unknown = files[filename];
            if (!isFile(data)) {
                return;
            }

            const compileTemplate = compileTemplateMap.get(data);
            if (compileTemplate) {
                const convertedText = getRenderedText(
                    compileTemplate,
                    filename,
                    data,
                    metalsmith,
                    options,
                );

                data.contents = Buffer.from(convertedText, 'utf8');
                debug(`file contents updated: ${filename}`);
            }
        });

        done(null, files, metalsmith);
    };
}, renderDefaultOptions);
