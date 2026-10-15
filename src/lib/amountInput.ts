/** 금액은 빈칸·잘못된 형식을 유효한 0으로 바꾸지 않는다. */
export function parseAmountInput(raw: string, max = Number.MAX_SAFE_INTEGER): number {
 const value=raw.trim().replace(/,/g, '');
 if(!/^\d+$/.test(value)) return Number.NaN;
 const amount=Number(value);
 return Number.isSafeInteger(amount) && amount<=max ? amount : Number.NaN;
}
export function formatAmountInput(raw: string, max = Number.MAX_SAFE_INTEGER): string {
 if(raw==='')return '';
 const amount=parseAmountInput(raw,max);
 return Number.isFinite(amount)?amount.toLocaleString('ko-KR'):raw;
}
