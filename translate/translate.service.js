// translate/translate.service.js
const axios = require('axios');

function normalize(code = 'en') {
  const c = String(code).trim().toLowerCase();
  const map = {
    'en': 'en', 'en-us': 'en', 'en-gb': 'en',
    'th': 'th',
    'ja': 'ja', 'jp': 'ja',
    'zh': 'zh', 'zh-cn': 'zh', 'zh-tw': 'zh',
    'ko': 'ko', 'kr': 'ko',
    'es': 'es', 'fr': 'fr', 'de': 'de', 'vi': 'vi', 'id': 'id', 'pt': 'pt'
  };
  return map[c] || c.slice(0, 2);
}

async function translateWithMyMemory(text, from, to) {
  const { data } = await axios.get('https://api.mymemory.translated.net/get', {
    params: { q: text, langpair: `${from}|${to}` },
    timeout: 8000
  });
  const main = data?.responseData?.translatedText;
  if (typeof main === 'string' && main.trim()) return main;

  if (Array.isArray(data?.matches)) {
    const best = data.matches
      .filter(m => m.translation && m.translation.trim())
      .sort((a, b) => (b.match ?? 0) - (a.match ?? 0))[0];
    if (best?.translation) return best.translation;
  }
  throw new Error('MyMemory returned empty translation');
}

async function translateWithLibre(text, from, to) {
  const { data } = await axios.post(
    'https://libretranslate.com/translate',
    { q: text, source: from, target: to, format: 'text' },
    { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
  );
  const out = data?.translatedText;
  if (typeof out === 'string' && out.trim()) return out;
  throw new Error('LibreTranslate returned empty translation');
}

async function translate(text, fromLang, toLang) {
  const from = normalize(fromLang);
  const to = normalize(toLang);
  if (!text || from === to) return text;

  try {
    return await translateWithMyMemory(text, from, to);
  } catch (e1) {
    console.warn('[translate] MyMemory failed:', e1.message);
    try {
      return await translateWithLibre(text, from, to);
    } catch (e2) {
      console.warn('[translate] LibreTranslate failed:', e2.message);
      return text; 
    }
  }
}



module.exports = { translate };
