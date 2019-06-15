import pug from 'pug';

const compileTemplateMap: WeakMap<Buffer, pug.compileTemplate> = new WeakMap();

export default compileTemplateMap;
