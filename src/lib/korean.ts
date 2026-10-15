type Particle = "을/를" | "이/가" | "은/는" | "과/와";
export function withParticle(value: string | number, pair: Particle): string {
  const text = String(value);
  const last = text.replace(/[\s)\]}〉》」』.,!?]+$/g, "").slice(-1);
  const code = last.charCodeAt(0);
  const consonant = code >= 0xac00 && code <= 0xd7a3
    ? (code - 0xac00) % 28 !== 0
    : /[013678LMNRlmnr]/.test(last);
  const [withConsonant, withoutConsonant] = pair.split("/");
  return text + (consonant ? withConsonant : withoutConsonant);
}
