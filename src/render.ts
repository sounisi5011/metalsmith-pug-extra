import createDebug from 'debug';
import deepFreeze from 'deep-freeze-strict';
import cloneDeep from 'lodash.clonedeep';
import Metalsmith from 'metalsmith';
import pug from 'pug';

import compileTemplateMap from './compileTemplateMap';
import {
    createEachPlugin,
    createPluginGenerator,
    FileInterface,
    isFile,
} from './utils';
import { DeepReadonly } from './utils/types';

const debug = createDebug('metalsmith-pug-extra:render');

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

let previousRenderOptions: Partial<RenderOptionsInterface> | undefined;

export function normalizeRenderOptions(
    options: Partial<RenderOptionsInterface>,
    defaultOptions: RenderOptionsInterface,
): RenderOptionsInterface {
    const mergedOptions = { ...defaultOptions, ...options };
    const partialOptions = mergedOptions.reuse
        ? { ...previousRenderOptions, ...options }
        : options;

    previousRenderOptions = partialOptions;

    return {
        ...defaultOptions,
        ...partialOptions,
    };
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
    const options = normalizeRenderOptions(opts, renderDefaultOptions);

    return createEachPlugin((filename, files, metalsmith) => {
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
    }, options.pattern);
}, renderDefaultOptions);
