import Anthropic from '@anthropic-ai/sdk'
import { getStore } from '@netlify/blobs'
import type { Config } from '@netlify/functions'

/* Website localisation for Dymek. Translates page text with Claude, written for each
   country's readers (not word-for-word), and caches every string in Netlify Blobs so
   each sentence is translated only once per language. */

const anthropic = new Anthropic()
const MODEL = 'claude-sonnet-5-5'

const LOCALES: Record<string, string> = {
  'zh-CN': 'Simplified Chinese for engineers and buyers in mainland China. Use standard mainland semiconductor and metrology terms (e.g. 晶圆, 工艺, 量测, 封装, 设备).',
  'zh-TW': 'Traditional Chinese as written in Taiwan (台灣正體中文). Use Taiwan industry terms (e.g. 晶圓, 製程, 量測, 封裝, 設備, 軟體, 網站), not mainland terms.',
  th: 'Thai for business and engineering readers in Thailand. Polite, professional tone; keep common English technical terms in Latin script where Thai engineers normally do.',
  ms: 'Bahasa Melayu (Malaysia) for engineers and buyers in Malaysia. Use Malaysian vocabulary and spelling, not Indonesian.',
  vi: 'Vietnamese for engineers and buyers in Vietnam. Professional, clear and natural.',
  id: 'Bahasa Indonesia for engineers and buyers in Indonesia. Use Indonesian vocabulary, not Malaysian.',
  ja: 'Japanese for engineers and buyers in Japan. Polite business style (です・ます), standard Japanese industry terms (ウェーハ, 計測, 半導体製造装置).',
  ko: 'Korean for engineers and buyers in South Korea. Formal business style (합니다체), standard Korean industry terms.',
}

const RULES = `You localise website text for Dymek Company Ltd., a distributor of semiconductor, optics, photonics and metrology equipment across Asia.
Write the way a skilled local marketing writer and engineer in the target country would: natural, accurate and persuasive, not a word-for-word translation.
Rules:
- Keep brand, company, principal and product names unchanged (Dymek, Dymo, EV Group, EVG, KLA, Thermo Fisher Scientific, 3D-Micromac, yieldWerx, Sonix, ThetaMetrisis, n&k, SEMICON, etc.).
- Keep numbers, units (µm, nm, Å, Torr, °C), formulas, email addresses, phone numbers and URLs exactly as they are.
- Keep any leading/trailing spaces and punctuation style suitable for the target language.
- Short UI labels (buttons, menu items) must stay short.
- If a string should not be translated (a code, a name, a number), return it unchanged.
Return ONLY a JSON array of strings, the same length and order as the input.`

function parseArray(raw: string): unknown[] {
  const start = raw.indexOf('[')
  if (start < 0) throw new Error('no array')
  let depth = 0, inStr = false, esc = false
  for (let i = start; i < raw.length; i++) {
    const c = raw[i]
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue }
    if (c === '"') inStr = true
    else if (c === '[') depth++
    else if (c === ']' && --depth === 0) return JSON.parse(raw.slice(start, i + 1))
  }
  throw new Error('unterminated array')
}

async function translate(lang: string, texts: string[]): Promise<string[]> {
  const msg = await anthropic.messages.stream({
    model: MODEL,
    max_tokens: 8000,
    system: [{ type: 'text', text: RULES }, { type: 'text', text: 'Target: ' + LOCALES[lang] }],
    messages: [{ role: 'user', content: JSON.stringify(texts) }],
  }).finalMessage()
  const raw = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim()
  const out = parseArray(raw)
  if (!Array.isArray(out) || out.length !== texts.length) throw new Error('length mismatch')
  return out.map((s: unknown, i: number) => (typeof s === 'string' && s.trim() ? s : texts[i]))
}

async function key(lang: string, text: string) {
  const d = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text))
  return lang + '/' + [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  let body: { lang?: string; texts?: unknown[] }
  try { body = await req.json() } catch { return new Response('Invalid JSON', { status: 400 }) }
  const lang = String(body.lang || '')
  if (!LOCALES[lang]) return new Response('Unsupported language', { status: 400 })
  const texts = (Array.isArray(body.texts) ? body.texts : []).slice(0, 80).map((t) => String(t).slice(0, 1500))
  if (!texts.length) return Response.json({ t: [] })

  const store = getStore('i18n')
  const keys = await Promise.all(texts.map((t) => key(lang, t)))
  const cached = await Promise.all(keys.map((k) => store.get(k).catch(() => null)))
  const missing = texts.map((t, i) => (cached[i] == null ? i : -1)).filter((i) => i > -1)
  const result = cached.map((c, i) => (c == null ? texts[i] : c)) as string[]

  if (missing.length) {
    try {
      const done = await translate(lang, missing.map((i) => texts[i]))
      await Promise.all(missing.map((i, j) => { result[i] = done[j]; return store.set(keys[i], done[j]).catch(() => {}) }))
    } catch (err) {
      console.error('translate error', err)
      const e = err as { status?: number; message?: string }
      return Response.json({ t: result, partial: true, err: String(e?.status || '') + ' ' + String(e?.message || '').slice(0, 160) }, { status: 200 })
    }
  }
  return Response.json({ t: result }, { headers: { 'Cache-Control': 'no-store' } })
}

export const config: Config = { path: '/api/translate' }
