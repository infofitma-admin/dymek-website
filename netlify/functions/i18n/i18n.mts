import { getStore } from '@netlify/blobs'
import type { Config } from '@netlify/functions'

/* Whole-site translation dictionaries, one per language, for instant language switching.
   GET  /api/i18n?lang=th  -> { "English text": "translation", ... }  (CDN cached)
   POST /api/i18n {lang, texts[]} -> rebuilds the dictionary from translations already
   produced and cached by /api/translate (never accepts translations from the client). */

const LANGS = ['zh-CN', 'zh-TW', 'th', 'ms', 'vi', 'id', 'ja', 'ko']

async function key(lang: string, text: string) {
  const d = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text))
  return lang + '/' + [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default async (req: Request) => {
  const store = getStore('i18n')
  if (req.method === 'GET') {
    const lang = new URL(req.url).searchParams.get('lang') || ''
    if (!LANGS.includes(lang)) return new Response('Unsupported language', { status: 400 })
    const dict = (await store.get('dict/' + lang)) || '{}'
    return new Response(dict, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Netlify-CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400', 'Netlify-Vary': 'query=lang' } })
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  let body: { lang?: string; texts?: unknown[] }
  try { body = await req.json() } catch { return new Response('Invalid JSON', { status: 400 }) }
  const lang = String(body.lang || '')
  if (!LANGS.includes(lang)) return new Response('Unsupported language', { status: 400 })
  const texts = [...new Set((Array.isArray(body.texts) ? body.texts : []).slice(0, 4000).map((t) => String(t).trim().slice(0, 1500)).filter(Boolean))]
  let dict: Record<string, string> = {}
  try { dict = JSON.parse((await store.get('dict/' + lang)) || '{}') } catch { dict = {} }
  let added = 0, missing = 0
  for (let i = 0; i < texts.length; i += 50) {
    const part = texts.slice(i, i + 50)
    const vals = await Promise.all(part.map(async (t) => store.get(await key(lang, t)).catch(() => null)))
    part.forEach((t, j) => { if (vals[j] != null) { if (dict[t] !== vals[j]) added++; dict[t] = vals[j] as string } else missing++ })
  }
  await store.set('dict/' + lang, JSON.stringify(dict))
  return Response.json({ lang, entries: Object.keys(dict).length, added, missing })
}

export const config: Config = { path: '/api/i18n' }
