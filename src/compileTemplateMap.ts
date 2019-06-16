import pug from 'pug';

import { FileInterface } from './utils';

const compileTemplateMap: WeakMap<
    FileInterface,
    pug.compileTemplate
> = new WeakMap();

export default compileTemplateMap;
