import Metalsmith from 'metalsmith';
import pug from 'pug';
import deepFreeze from 'deep-freeze-strict';

import {
    FileInterface,
    isFile,
    freezeProperty,
    createEachPlugin,
} from './utils';
import compileTemplateMap from './compileTemplateMap';

export interface RenderOptionsInterface {
    locals: pug.LocalsObject;
    useMetadata: boolean;
}

export function getRenderOptions<T extends RenderOptionsInterface>(
    options: T,
): RenderOptionsInterface & {
    otherOptions: Omit<T, keyof RenderOptionsInterface>;
} {
    const { locals, useMetadata, ...otherOptions } = options;
    return { locals: { ...locals }, useMetadata, otherOptions };
}

export function getConvertedText(
    compileTemplate: pug.compileTemplate,
    data: FileInterface,
    metalsmith: Metalsmith,
    options: RenderOptionsInterface,
): string {
    const { locals, useMetadata } = getRenderOptions(options);

    if (useMetadata) {
        Object.assign(locals, metalsmith.metadata(), data);
    }

    const convertedText = compileTemplate(locals);

    return convertedText;
}

export const renderDefaultOptions: RenderOptionsInterface = deepFreeze({
    locals: {},
    useMetadata: false,
});

export interface RenderFuncInterface {
    (options?: Partial<RenderOptionsInterface>): Metalsmith.Plugin;
    defaultOptions: RenderOptionsInterface;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const render: RenderFuncInterface = function(opts = {}) {
    const options = {
        ...renderDefaultOptions,
        ...opts,
    };

    return createEachPlugin((filename, files, metalsmith) => {
        const data: unknown = files[filename];
        if (!isFile(data)) {
            return;
        }

        const compileTemplate = compileTemplateMap.get(data.contents);
        if (compileTemplate) {
            const convertedText = getConvertedText(
                compileTemplate,
                data,
                metalsmith,
                options,
            );

            data.contents = Buffer.from(convertedText, 'utf8');
        }
    });
};

render.defaultOptions = renderDefaultOptions;
freezeProperty(render, 'defaultOptions');
