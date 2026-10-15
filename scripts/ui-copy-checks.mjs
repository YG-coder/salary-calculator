import assert from 'node:assert/strict';
export function visibleCopy(html) {
 const attrs=[...html.matchAll(/(?:aria-label|placeholder|title|alt)="([^"]*)"/g)].map(m=>m[1]).join(' ');
 return html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<[^>]*>/g,' ')+' '+attrs;
}
export function inspectCopy(html, label, allow=[]) {
 // Reviewed product/proper names; never allow calculator state/field identifiers.
 const allowed=new Set(['OpenAI','YouTube','iPhone','JavaScript','TypeScript','NodeJS',...allow]);
 const found=[...visibleCopy(html).matchAll(/\b(?:[a-z]+[A-Z]\w*|[A-Za-z]\w*_\w+)\b/g)].map(m=>m[0]).filter(x=>!allowed.has(x));
 assert.deepEqual([...new Set(found)],[],`${label}: internal identifiers in visible copy`);
}
export function inspectParticleTemplates(ts, text, path) {
 const source=ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true,path.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const bad=[];const particle=/^(?:을|를|(?:이|가|은|는|과|와)(?=[\s.,!?()]))/;
 function visit(node) {
  if(ts.isTemplateExpression(node))for(const span of node.templateSpans)if(particle.test(span.literal.text))bad.push(span.literal.text.slice(0,12));
  if(ts.isJsxElement(node)||ts.isJsxFragment(node))node.children.forEach((child,i)=>{const next=node.children[i+1];if(ts.isJsxExpression(child)&&child.expression&&next&&ts.isJsxText(next)&&particle.test(next.text.trimStart()))bad.push(next.text.slice(0,12));});
  ts.forEachChild(node,visit);
 }visit(source);assert.deepEqual(bad,[],`${path}: use the Korean particle helper`);
}
