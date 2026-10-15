import { it as check } from 'vitest';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { inspectCopy, inspectParticleTemplates } from '../../../scripts/ui-copy-checks.mjs';
check('rendered copy rejects private identifiers but ignores source scripts',()=>{
 assert.throws(()=>inspectCopy('<p>priorAnnualDeductible 반영</p>','result'));
 assert.throws(()=>inspectCopy('<p>annual_paid 적용</p>','result'));
 inspectCopy('<script>const priorAnnualDeductible=0;</script><p>기존 누적액 0원 가정</p>','result');
 inspectCopy('<p>YouTube</p>','proper name');
});
check('particle templates must use the shared helper, without matching 이상/이하',()=>{
 assert.throws(()=>inspectParticleTemplates(ts,'const copy = `${drug}를 선택했습니다`','view.ts'));
 inspectParticleTemplates(ts,'const copy = `${amount}이상`','view.ts');
 inspectParticleTemplates(ts,'const copy = `${withParticle(drug, "을/를")} 선택했습니다`','view.ts');
});
