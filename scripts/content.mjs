import fs from 'node:fs';

const read = file => JSON.parse(fs.readFileSync(`content/${file}`, 'utf8').replace(/^\uFEFF/, ''));
export function loadModules() {
  const modules = ['quantity', 'data', 'verbal', 'knowledge'].map(id => read(`${id}.json`));
  const additions = {
    quantity: ['quantity-applied.json'],
    data: ['data-charts.json'],
    verbal: ['verbal-applied.json'],
    knowledge: ['knowledge-extra.json', 'knowledge-policy-extra.json', 'knowledge-applied.json'],
  };
  for (const module of modules) {
    for (const file of additions[module.id]) {
      const extra = read(file);
      for (const key of ['lessons', 'cards', 'sources']) {
        module[key] ??= [];
        module[key].push(...(extra[key] || []));
      }
    }
  }
  for (const source of read('resources-extra.json').sources) {
    modules.find(m => m.id === source.module).sources.push(source);
  }
  return modules;
}
