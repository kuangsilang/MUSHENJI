/* ============================================================
 * 应用层：导航 / 水墨转场 / 详情抽屉 / HUD / 加载
 * ============================================================ */
import { Engine, isMobile } from './engine.js'
import { META, ERAS, EVENTS, CHARACTERS, REGIONS, REALMS, FACTIONS, FACTION_REL, CHARACTER_GROUPS, SIL, CHAR_MORE, FAC_MORE, TECHNIQUES } from './data.js'
import { svgPortrait, svgCrest, svgRegionIcon, meander } from './art.js'
import { createHero } from './scenes/hero.js'
import { createTimeline } from './scenes/timeline.js'
import { createStars } from './scenes/stars.js'
import { createMap } from './scenes/map.js'
import { createLadder } from './scenes/ladder.js'

const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const FACTION_MEMBERS = {
  tianmojiao: ['天魔教'], yankangf: ['延康', '主角'], shangcang: ['远古'],
  fomen: [], youduf: ['幽都'], kaihuangf: ['远古'], miluof: ['弥罗宫'],
  canlaof: ['残老村'], shensheng: [], wentiange: [], jiutianzun: ['延康', '主角']
}

const VIEWS = ['hero', 'timeline', 'stars', 'map', 'ladder']
const NAV = [
  { id: 'hero', name: '序章' },
  { id: 'timeline', name: '编年史' },
  { id: 'stars', name: '人物谱' },
  { id: 'map', name: '山河图' },
  { id: 'ladder', name: '修行路' }
]

let eng, scenes = {}, current = 'hero', busy = false
const drawer = $('#drawer')

/* ---------------- 标签解析（事件 tags → 可跳转 chips） ---------------- */
function resolveTag(tag) {
  const ch = CHARACTERS.find((c) => c.name === tag || (c.alt || '').includes(tag))
  if (ch) return { type: 'char', ref: ch, label: tag }
  const rg = REGIONS.find((r) => r.name === tag || r.notable?.includes(tag))
  if (rg) return { type: 'region', ref: rg, label: tag }
  const fc = FACTIONS.find((f) => f.name === tag)
  if (fc) return { type: 'faction', ref: fc, label: tag }
  return { type: 'plain', label: tag }
}
function chipHTML(t, opt = {}) {
  const r = opt.force || resolveTag(t)
  const cls = r.type === 'plain' ? 'chip' : `chip link ${r.type}`
  return `<button class="${cls}" data-type="${r.type}" data-id="${r.ref?.id || ''}" data-label="${esc(t)}">${esc(t)}</button>`
}

/* ---------------- 详情抽屉 ---------------- */
function openDrawer(html, cls = '') {
  drawer.className = 'open ' + cls
  $('#drawer-body').innerHTML = html
  $('#drawer-close').focus?.()
}
function closeDrawer() { drawer.className = '' }

function openEvent(ev) {
  const era = ERAS.find((e) => e.id === ev.era)
  openDrawer(`
    <div class="d-head">
      <span class="d-era" style="--c:${era.color}">${era.short}纪元</span>
      <span class="d-track">${ev.track === 'path' ? '牧之旅程' : '纪元长河'}</span>
      ${ev.anime ? '<span class="d-anime">动画已演绎</span>' : ''}
    </div>
    <h2 class="d-title">${esc(ev.title)}</h2>
    <div class="d-time">${esc(ev.time)}</div>
    ${meander(320)}
    <p class="d-text">${esc(ev.text)}</p>
    <div class="d-chips">${ev.tags.map((t) => chipHTML(t)).join('')}</div>
  `)
}

function openCharacter(ch) {
  const relChips = (ch.rels?.length ? ch.rels : (ch.linked || []).map((id) => [id, '相关'])).map(([id, label]) => {
    const c = CHARACTERS.find((x) => x.id === id)
    return c ? `<button class="chip link char" data-type="char" data-id="${c.id}"><i class="rel-dot" style="--c:${c.color}"></i>${esc(label)} · ${esc(c.name)}</button>` : ''
  }).join('')
  openDrawer(`
    <div class="portrait-wrap">${svgPortrait({ ...ch, sil: SIL[ch.id] || 'youth' })}</div>
    <div class="d-head">
      <span class="d-era" style="--c:${ch.color}">${esc(ch.group)}</span>
      <span class="d-track">${esc(ch.realm)}</span>
    </div>
    <h2 class="d-title">${esc(ch.name)}</h2>
    <div class="d-time">${esc(ch.title)}</div>
    ${ch.alias ? `<div class="d-alt">${esc(ch.alias)}</div>` : ''}
    ${meander(320)}
    <p class="d-text">${esc(ch.blurb)}</p>
    ${CHAR_MORE[ch.id] ? `<p class="d-text">${esc(CHAR_MORE[ch.id])}</p>` : ''}
    ${relChips ? `<div class="d-sub">关系</div><div class="d-chips">${relChips}</div>` : ''}
  `)
}

function openRegion(r) {
  const related = EVENTS.filter((ev) => ev.tags.includes(r.name) || r.notable.some((n) => ev.tags.includes(n)))
  openDrawer(`
    <div class="d-head">
      <span class="d-era" style="--c:${r.color}">${svgRegionIcon(r.icon, r.color)} 山河志</span>
    </div>
    <h2 class="d-title">${esc(r.name)}</h2>
    <div class="d-time">${esc(r.tagline)}</div>
    ${meander(320)}
    <p class="d-text">${esc(r.desc)}</p>
    <div class="d-sub">要地</div>
    <div class="d-chips">${r.notable.map((n) => chipHTML(n)).join('')}</div>
    ${related.length ? `<div class="d-sub">相关史载</div><div class="d-list">${related.map((ev) =>
      `<button class="rowlink" data-type="event" data-id="${ev.id}"><i style="--c:${r.color}"></i>${esc(ev.title)}</button>`).join('')}</div>` : ''}
  `)
}

function openRealm(r) {
  const i = REALMS.indexOf(r)
  const tierName = r.tier === 'seven' ? '七大神藏' : r.tier === 'heaven' ? '天宫成神' : '第八重之外'
  openDrawer(`
    <div class="d-head">
      <span class="d-era" style="--c:${r.color}">${tierName} · 第 ${i + 1} 重</span>
    </div>
    <h2 class="d-title">${esc(r.name)}</h2>
    <div class="d-time en">${esc(r.en)}</div>
    ${meander(320)}
    <p class="d-text">${esc(r.desc)}</p>
    <div class="d-nav">
      ${i > 0 ? `<button class="chip link" data-type="realm" data-id="${REALMS[i - 1].id}">← ${REALMS[i - 1].name}</button>` : ''}
      ${i < REALMS.length - 1 ? `<button class="chip link" data-type="realm" data-id="${REALMS[i + 1].id}">${REALMS[i + 1].name} →</button>` : ''}
    </div>
  `)
}

function openFaction(f) {
  const members = CHARACTERS.filter((c) => (FACTION_MEMBERS[f.id] || []).includes(c.group))
  const hq = REGIONS.find((r) => r.id === f.hq)
  openDrawer(`
    <div class="d-head"><span class="d-era" style="--c:${f.color}">${svgCrest(f)} 势力志</span></div>
    <h2 class="d-title">${esc(f.name)}</h2>
    <div class="d-time">${esc(f.alias)}</div>
    <p class="d-creed" style="--c:${f.color}">「${esc(f.creed)}」</p>
    ${meander(320)}
    <p class="d-text">${esc(f.desc)}</p>
    ${FAC_MORE[f.id] ? `<p class="d-text">${esc(FAC_MORE[f.id])}</p>` : ''}
    <p class="d-alt">现状 · ${esc(f.status)}</p>
    ${hq ? `<div class="d-sub">据点</div><div class="d-chips"><button class="chip link region" data-type="region" data-id="${hq.id}" data-map="1" style="--c:${hq.color}">${svgRegionIcon(hq.icon, hq.color)}${esc(hq.name)} · 前往山河图</button></div>` : ''}
    ${members.length ? `<div class="d-sub">人物</div><div class="d-chips">${members.map((c) =>
      `<button class="chip link char" data-type="char" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>` : ''}
  `)
}

function openEra(era) {
  const list = EVENTS.filter((ev) => ev.era === era.id)
  openDrawer(`
    <div class="d-head"><span class="d-era" style="--c:${era.color}">纪元志</span></div>
    <h2 class="d-title">${esc(era.name)}</h2>
    <div class="d-time">${esc(era.tagline)}</div>
    ${meander(320)}
    <p class="d-text">${esc(era.desc)}</p>
    <div class="d-sub">本纪史载</div>
    <div class="d-list">${list.map((ev) =>
      `<button class="rowlink" data-type="event" data-id="${ev.id}"><i style="--c:${era.color}"></i><span>${esc(ev.title)}<em>${ev.track === 'path' ? '牧之旅程' : '纪元长河'}</em></span></button>`).join('')}</div>
  `)
}

function openMeta() {
  openDrawer(`
    <div class="d-head"><span class="d-era" style="--c:#f5cf6b">卷首 · 档案</span></div>
    <h2 class="d-title">牧神记</h2>
    <div class="d-time">${esc(META.subtitle)}</div>
    ${meander(320)}
    <div class="d-sub">原著</div>
    <p class="d-text">${esc(META.novel.author)} · ${esc(META.novel.platform)}<br>${esc(META.novel.span)} · ${esc(META.novel.words)}</p>
    <p class="d-text dim">${esc(META.novel.desc)}</p>
    <div class="d-sub">动画</div>
    <p class="d-text">${esc(META.anime.studio)}<br>${esc(META.anime.director)}<br>${esc(META.anime.premiere)}<br>${esc(META.anime.schedule)}<br>${esc(META.anime.scale)}</p>
    <ul class="d-note">${META.anime.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
    <div class="d-sub">铭</div>
    <p class="d-slogan">「${esc(META.slogan)}」<br>「${esc(META.slogan2)}」</p>
    <p class="d-text dim small">${esc(META.disclaimer)}</p>
  `)
}

/* ---------------- 抽屉/ chips 事件委托 ---------------- */
drawer.addEventListener('click', (e) => {
  if (e.target.id === 'drawer-close') return closeDrawer()
  const btn = e.target.closest('[data-type]')
  if (!btn) return
  const { type, id, label } = btn.dataset
  if (type === 'char') return openCharacter(CHARACTERS.find((c) => c.id === id))
  if (type === 'event') return openEvent(EVENTS.find((x) => x.id === id))
  if (type === 'tech') return openTech(TECHNIQUES.find((x) => x.id === id))
  if (type === 'region') {
    const r = REGIONS.find((x) => x.id === id)
    if (btn.dataset.map) {
      closeDrawer()
      switchView('map')
      setTimeout(() => scenes.map?.focusRegion(id), 600)
    }
    return openRegion(r)
  }
  if (type === 'realm') { const r = REALMS.find((x) => x.id === id); openRealm(r); scenes.ladder?.jumpRealm(id) }
  if (type === 'faction') return openFaction(FACTIONS.find((x) => x.id === id))
  if (type === 'plain') return
})
$('#drawer-veil').addEventListener('click', closeDrawer)

/* ---------------- 水墨转场 ---------------- */
function switchView(name) {
  if (busy || name === current) return
  busy = true
  const ink = $('#ink')
  ink.style.setProperty('--x', '50%'); ink.style.setProperty('--y', '50%')
  ink.classList.add('cover')
  setTimeout(() => {
    eng.switchTo(name)
    current = name
    document.body.dataset.view = name
    $$('main .view').forEach((v) => v.classList.toggle('active', v.dataset.view === name))
    $$('#nav a').forEach((a) => a.classList.toggle('on', a.dataset.view === name))
  }, 480)
  setTimeout(() => {
    ink.classList.remove('cover')
    ink.classList.add('reveal')
    setTimeout(() => { ink.classList.remove('reveal'); busy = false }, 520)
  }, 560)
}

$('#nav').addEventListener('click', (e) => {
  const a = e.target.closest('a[data-view]')
  if (a) { e.preventDefault(); switchView(a.dataset.view) }
})
$('#about-btn').addEventListener('click', openMeta)
document.querySelectorAll('[data-goto]').forEach((b) =>
  b.addEventListener('click', () => switchView(b.dataset.goto)))

/* ---------------- HUD 构建 ---------------- */
function buildHud() {
  /* 编年史：纪元 chips */
  const eraRow = $('#hud-timeline .era-row')
  eraRow.innerHTML = `<button class="chip" data-reset>回瞰全河</button>` + ERAS.map((e) =>
    `<button class="chip era" style="--c:${e.color}" data-era="${e.id}">${e.short}</button>`).join('')
  eraRow.addEventListener('click', (e) => {
    const r = e.target.closest('[data-reset]')
    if (r) return scenes.timeline?.resetView()
    const b = e.target.closest('[data-era]')
    if (!b) return
    const era = ERAS.find((x) => x.id === b.dataset.era)
    scenes.timeline?.jumpEra(era.id)
    openEra(era)
  })

  /* 人物谱：星曜/势力志 切换 + 分组 chips */
  const tabRow = $('#hud-stars .tab-row')
  tabRow.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]')
    if (!b) return
    $$('[data-tab]', tabRow).forEach((x) => x.classList.toggle('on', x === b))
    $('#view-stars').classList.toggle('factions-mode', b.dataset.tab === 'factions')
    buildFactionGrid()
  })
  const grpRow = $('#hud-stars .grp-row')
  grpRow.innerHTML = ['全部', ...CHARACTER_GROUPS].map((g) =>
    `<button class="chip ${g === '全部' ? 'on' : ''}" data-grp="${g}">${g}</button>`).join('')
  grpRow.addEventListener('click', (e) => {
    const b = e.target.closest('[data-grp]')
    if (!b) return
    $$('[data-grp]', grpRow).forEach((x) => x.classList.toggle('on', x === b))
    scenes.stars?.highlightGroup(b.dataset.grp)
  })

  /* 山河图：区域 chips */
  const rgRow = $('#hud-map .rg-row')
  rgRow.innerHTML = REGIONS.map((r) =>
    `<button class="chip era" style="--c:${r.color}" data-rg="${r.id}">${svgRegionIcon(r.icon, r.color)}${r.name}</button>`).join('')
  rgRow.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rg]')
    if (!b) return
    const r = REGIONS.find((x) => x.id === b.dataset.rg)
    scenes.map?.focusRegion(r.id)
    openRegion(r)
  })

  /* 修行路：境界/绝学谱 切换 + 阶位 chips */
  const ladTabRow = $('#hud-ladder .tab-row')
  ladTabRow.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]')
    if (!b) return
    $$('[data-tab]', ladTabRow).forEach((x) => x.classList.toggle('on', x === b))
    $('#view-ladder').classList.toggle('tech-mode', b.dataset.tab === 'tech')
    if (b.dataset.tab === 'tech') buildTechGrid()
  })
  const tierRow = $('#hud-ladder .tier-row')
  const tiers = [['seven', '七大神藏'], ['heaven', '天宫成神'], ['beyond', '第八重之外']]
  tierRow.innerHTML = tiers.map(([id, name]) =>
    `<button class="chip" data-tier="${id}">${name}</button>`).join('')
  tierRow.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tier]')
    if (!b) return
    const first = REALMS.find((r) => r.tier === b.dataset.tier)
    if (first) { scenes.ladder?.jumpRealm(first.id); openRealm(first) }
  })
}

/* ---------------- 启动 ---------------- */
async function boot() {
  eng = new Engine($('#gl'))
  const mk = (fn, view) => {
    const layer = $(`#view-${view} .labels`)
    return fn(eng, {
      layer,
      onOpenEvent: openEvent,
      onOpenCharacter: openCharacter,
      onOpenRegion: openRegion,
      onOpenRealm: openRealm
    })
  }
  scenes = {
    hero: mk(createHero, 'hero'),
    timeline: mk(createTimeline, 'timeline'),
    stars: mk(createStars, 'stars'),
    map: mk(createMap, 'map'),
    ladder: mk(createLadder, 'ladder')
  }
  for (const [name, s] of Object.entries(scenes)) {
    s.root.visible = name === 'hero'
    eng.register(name, s)
  }
  eng.switchTo('hero')
  buildHud()
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer() })

  await document.fonts?.ready?.catch?.(() => { })
  const loader = $('#loader')
  loader.classList.add('done')
  setTimeout(() => loader.remove(), 900)
  document.body.classList.add('ready')
  /* 开场字幕（每会话一次） */
  const intro = $('#intro')
  if (intro && !sessionStorage.getItem('msj_prelude')) {
    sessionStorage.setItem('msj_prelude', '1')
    document.body.classList.add('prelude')
    setTimeout(() => intro.classList.add('show'), 750)
    setTimeout(() => intro.classList.add('bye'), 5800)
    setTimeout(() => { intro.remove(); document.body.classList.remove('prelude') }, 7000)
  }
}

/* ---------------- 势力志网格 + 关系网 ---------------- */
/* ---------------- 绝学谱 ---------------- */
function openTech(t) {
  const owner = CHARACTERS.find((c) => c.id === t.owner)
  openDrawer(`
    <div class="d-head">
      <span class="d-era" style="--c:${t.color}">${esc(t.kind)}</span>
      <span class="d-track">品阶 · ${esc(t.tier)}</span>
    </div>
    <h2 class="d-title">${esc(t.name)}</h2>
    ${owner ? `<div class="d-time">传人 · ${esc(owner.name)}（${esc(owner.title)}）</div>` : ''}
    ${meander(320)}
    <p class="d-text">${esc(t.desc)}</p>
    ${t.note ? `<p class="d-alt">考据 · ${esc(t.note)}</p>` : ''}
    ${owner ? `<div class="d-sub">传人</div><div class="d-chips"><button class="chip link char" data-type="char" data-id="${owner.id}">${esc(owner.name)}</button></div>` : ''}
  `)
}
function buildTechGrid() {
  const g = $('#tech-grid')
  if (!g || g.dataset.built) return
  g.dataset.built = '1'
  g.innerHTML = TECHNIQUES.map((t) => {
    const owner = CHARACTERS.find((c) => c.id === t.owner)
    return `<button class="fcard" data-tech="${t.id}" style="--c:${t.color}">
      <span class="tbadge">${esc(t.tier)}</span><b>${esc(t.name)}</b>
      <i>${esc(t.kind)}</i>
      <span>${owner ? '传人 · ' + esc(owner.name) : '诸天之间'}</span>
    </button>`
  }).join('')
  g.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tech]')
    if (b) openTech(TECHNIQUES.find((t) => t.id === b.dataset.tech))
  })
}

function buildFactionGrid() {
  const g = $('#faction-grid')
  if (!g || g.dataset.built) return
  g.dataset.built = '1'
  g.innerHTML = FACTIONS.map((f) => {
    const members = CHARACTERS.filter((c) => (FACTION_MEMBERS[f.id] || []).includes(c.group))
    return `<button class="fcard" data-faction="${f.id}" style="--c:${f.color}">
      ${svgCrest(f)}<b>${esc(f.name)}</b><i>${esc(f.alias)}</i>
      <span>${members.map((m) => esc(m.name)).join(' · ') || '诸天之间'}</span>
    </button>`
  }).join('')
  g.addEventListener('click', (e) => {
    const b = e.target.closest('[data-faction]')
    if (b) openFaction(FACTIONS.find((f) => f.id === b.dataset.faction))
  })
  buildFactionWeb()
}

function buildFactionWeb() {
  const w = $('#faction-web')
  if (!w || w.dataset.built) return
  w.dataset.built = '1'
  const W = 560, H = 288, cx = W / 2, cy = H / 2, R = 108
  const pos = {}
  FACTIONS.forEach((f, i) => {
    const a = (i / FACTIONS.length) * Math.PI * 2 - Math.PI / 2
    pos[f.id] = [cx + Math.cos(a) * R * 1.55, cy + Math.sin(a) * R * 0.86]
  })
  const lines = FACTION_REL.map(([a, b, type, col]) => {
    const [x1, y1] = pos[a], [x2, y2] = pos[b]
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="1.3" opacity=".55" ${type === '敌对' ? 'stroke-dasharray="6 5"' : ''}/>`
  }).join('')
  const nodes = FACTIONS.map((f) => {
    const [x, y] = pos[f.id]
    return `<g class="wnode" data-faction="${f.id}">
      <circle cx="${x}" cy="${y}" r="21" fill="#0a0d15" stroke="${f.color}" stroke-opacity=".8"/>
      <circle cx="${x}" cy="${y}" r="26" fill="none" stroke="${f.color}" stroke-opacity=".25" stroke-dasharray="3 5"/>
      <text x="${x}" y="${y + 7}" text-anchor="middle" fill="${f.color}" font-size="19">${f.name.charAt(0)}</text>
      <text x="${x}" y="${y + 44}" text-anchor="middle" fill="#c9cdd8" font-size="12.5" letter-spacing="2">${f.name}</text>
    </g>`
  }).join('')
  w.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:min(92vw,${W}px)">
    ${lines}${nodes}
    <text x="${cx}" y="${H - 6}" text-anchor="middle" fill="#6f7686" font-size="11" letter-spacing="3">金实线 同盟 · 红虚线 敌对 · 青/紫线 渊源因果 · 点击势力入局</text>
  </svg>`
  w.addEventListener('click', (e) => {
    const n = e.target.closest('.wnode')
    if (n) openFaction(FACTIONS.find((f) => f.id === n.dataset.faction))
  })
}

/* ---------------- 环境音（WebAudio 合成，无音频文件） ---------------- */
let actx = null, ambOn = false, amb = null
function ensureAudio() { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)() }
function chime(freq, dur = 1.4, vol = 0.16) {
  if (!ambOn || !actx) return
  const o = actx.createOscillator(), g = actx.createGain()
  o.type = 'sine'; o.frequency.value = freq
  g.gain.setValueAtTime(0, actx.currentTime)
  g.gain.linearRampToValueAtTime(vol, actx.currentTime + 0.03)
  g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur)
  o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + dur)
}
function startAmb() {
  const c = actx
  const master = c.createGain(); master.gain.value = 0; master.connect(c.destination)
  master.gain.linearRampToValueAtTime(0.13, c.currentTime + 2.5)
  const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const noise = c.createBufferSource(); noise.buffer = buf; noise.loop = true
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300
  const lfo = c.createOscillator(); lfo.frequency.value = 0.06
  const lg = c.createGain(); lg.gain.value = 150
  lfo.connect(lg); lg.connect(lp.frequency); lfo.start()
  noise.connect(lp); lp.connect(master); noise.start()
  amb = { master }
  setInterval(() => chime(1174, 2.4, 0.045), 12000)
}
$('#sound-btn').addEventListener('click', () => {
  ensureAudio(); ambOn = !ambOn
  if (ambOn) {
    if (!amb) startAmb(); else amb.master.gain.linearRampToValueAtTime(0.13, actx.currentTime + 1)
    $('#sound-btn').textContent = '♪ 音效：开'
  } else {
    if (amb) amb.master.gain.linearRampToValueAtTime(0, actx.currentTime + 0.8)
    $('#sound-btn').textContent = '♪ 音效：关'
  }
})
addEventListener('lantern', (e) => chime(e.detail?.big ? 523 : 784, 1.6, 0.1))

/* ---------------- 画质开关 ---------------- */
let hiQ = true
$('#quality-btn').addEventListener('click', () => {
  hiQ = !hiQ
  eng.renderer.setPixelRatio(hiQ ? Math.min(devicePixelRatio, isMobile ? 1.5 : 1.75) : 1)
  eng.bloom.strength = hiQ ? (isMobile ? 0.75 : 0.9) : 0.4
  $('#quality-btn').textContent = hiQ ? '✦ 画质：高' : '✦ 画质：流畅'
})

/* ---------------- 序章小交互：光标提灯 / 铭言轮换 ---------------- */
const cg = $('#cursor-glow')
addEventListener('pointermove', (e) => { cg.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)` })
addEventListener('pointerdown', () => cg.classList.add('hold'))
addEventListener('pointerup', () => cg.classList.remove('hold'))

const QUOTES = [
  '「大墟的祖训说，天黑，别出门。」<br>「人人如龙。」',
  '「一口剑，照耀一个时代。」<br>「杀猪刀法，劈破天。」',
  '「你根本不知道龙汉时代的黑暗。」<br>「——天黑，别出门。」'
]
let qi = 0
const quoteEl = $('.hero-quote')
if (quoteEl) setInterval(() => {
  quoteEl.classList.add('fade')
  setTimeout(() => { qi = (qi + 1) % QUOTES.length; quoteEl.innerHTML = QUOTES[qi]; quoteEl.classList.remove('fade') }, 520)
}, 6800)

boot()
