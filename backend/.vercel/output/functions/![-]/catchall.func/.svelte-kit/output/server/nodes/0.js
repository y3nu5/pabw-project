

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.axmUAANN.js","_app/immutable/chunks/BBx9jlSs.js","_app/immutable/chunks/BExlx1mT.js","_app/immutable/chunks/qa_0k5dF.js"];
export const stylesheets = [];
export const fonts = [];
