import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
type Node = { type: unknown; props: Record<string, unknown> };
const internal = (React as unknown as Record<string, { H: unknown }>).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
export function uiHarness(Component: () => unknown) {
  const slots: unknown[] = []; let cursor = 0;
  const state = (init: unknown) => { const i=cursor++; if(i>=slots.length)slots.push(typeof init==='function'?(init as ()=>unknown)():init);return [slots[i],(value:unknown)=>{slots[i]=typeof value==='function'?(value as (p:unknown)=>unknown)(slots[i]):value;}]; };
  const dispatcher = { useState:state, useRef:(value:unknown)=>{const [ref]=state({current:value});return ref;}, useMemo:(fn:()=>unknown)=>fn(), useCallback:(fn:unknown)=>fn, useEffect:()=>{}, useLayoutEffect:()=>{}, useId:()=>`test-${cursor++}` };
  const tree=()=>{cursor=0;const previous=internal.H;internal.H=dispatcher;try{return Component();}finally{internal.H=previous;}};
  const nodes=()=>{const out:Node[]=[];const walk=(x:unknown)=>{if(Array.isArray(x)){x.forEach(walk);return;}if(!x||typeof x!=='object')return;const n=x as Node;if(n.type){out.push(n);walk(n.props?.children);}};walk(tree());return out;};
  return { nodes, html:()=>renderToStaticMarkup(tree() as React.ReactNode), change:(id:string,value:string)=>{const node=nodes().find(n=>n.props.id===id);if(!node||typeof node.props.onChange!=='function')throw Error(`field missing ${id}`);node.props.onChange({target:{value}});}, props:(name:string)=>nodes().find(n=>typeof n.type==='function'&&n.type.name===name)?.props };
}
export function visibleCopy(html:string) {
  const attrs=[...html.matchAll(/(?:aria-label|placeholder|title|alt)="([^"]*)"/g)].map(m=>m[1]).join(' ');
  return html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<[^>]*>/g,' ')+' '+attrs;
}
export function identifiers(text:string) {
  const allowed=new Set(['OpenAI','YouTube','iPhone','MonteCarlo','JavaScript','TypeScript','NodeJS']);
  return [...text.matchAll(/\b(?:[a-z]+[A-Z]\w*|[A-Za-z]\w*_\w+)\b/g)].map(m=>m[0]).filter(x=>!allowed.has(x));
}
