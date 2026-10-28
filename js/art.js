/* ============================================================
 * 视觉资产层：皮影剪影人物立绘 / 势力徽记 / 区域图标
 * 风格：水墨剪纸剪影 + 鎏金轮廓光 + 大字书法 + 印章
 * ============================================================ */

const P = (d) => d // path helper

/* 剪影库：bust(path), props[](d) —— viewBox 0 0 200 240，地面 y≈214 */
const BUSTS = {
  /* 少年：提灯 */
  youth: {
    bust: P('M100 96c-11 0-19-8-19-20 0-13 8-22 19-22s19 9 19 22c0 12-8 20-19 20zm-30 14c4-9 14-14 30-14s26 5 30 14c4 8 5 18 5 30v74H65v-74c0-12 1-22 5-30z'),
    hair: P('M100 56c-12 0-20 8-22 18 3-6 8-9 12-9-2-3-1-6 1-8 1 3 3 4 6 4 5-1 10 2 13 7-2-8-6-12-10-12z'),
    props: [
      { d: P('M146 150l-7 64m7-64c-6-4-6-10 0-14m0 14c6-4 6-10 0-14'), cls: 'ln' },
      { d: P('M139 150h14l4 22c-7 4-15 4-22 0z'), cls: 'lamp', glow: '#ffcf7a' }
    ]
  },
  /* 村长：担架上的无肢老者 */
  stretcher: {
    bust: P('M78 150c6-14 12-20 22-20s16 6 22 20c3 8 4 14 4 22H74c0-8 1-14 4-22zm-2 22h48l30 14-4 10-26-10H76l-26 10-4-10z'),
    props: [
      { d: P('M44 196h112'), cls: 'ln' },
      { d: P('M100 128v-18m-8-2c2-6 5-9 8-9s6 3 8 9c-3-2-13-2-16 0z'), cls: 'ln' }
    ]
  },
  /* 婆婆：盘发拈针 */
  granny: {
    bust: P('M100 92c-10 0-18-8-18-19 0-12 8-21 18-21s18 9 18 21c0 11-8 19-18 19zm-27 18c4-8 14-13 27-13s23 5 27 13c4 9 6 19 6 32v68H67v-68c0-13 2-23 6-32z'),
    hair: P('M100 52c-13 0-21 9-23 20 4-5 9-8 14-8 0 0-3 3 0 5 3-3 12-4 18 1 6-4 10-2 14 2-2-11-10-20-23-20zm6 16c6 2 9 6 9 11-4-3-7-4-11-4z'),
    props: [{ d: P('M142 132l26 40m0 0l-8-3m8 3l-2-9'), cls: 'ln', glow: '#ffb0d0' }]
  },
  /* 半身刀客 */
  halfman: {
    bust: P('M100 88c-11 0-20-9-20-21s9-21 20-21 20 9 20 21-9 21-20 21zm-31 20c5-10 16-15 31-15s26 5 31 15c4 9 6 20 6 34v52H63v-52c0-14 2-25 6-34z'),
    props: [
      { d: P('M63 214c0-18 16-30 37-30s37 12 37 30'), cls: 'ln' },
      { d: P('M138 96l34-52 8 5-30 50z'), cls: 'blade', glow: '#ff7a5c' }
    ]
  },
  /* 斗笠盲枪客 */
  strawhat: {
    bust: P('M100 100c-9 0-16-7-16-17s7-17 16-17 16 7 16 17-7 17-16 17zm-29 12c5-8 15-12 29-12s24 4 29 12c4 9 6 20 6 34v64H65v-64c0-14 2-25 6-34z'),
    hat: P('M60 84c8-14 24-22 40-22s32 8 40 22c-24 8-56 8-80 0z'),
    props: [{ d: P('M40 214L160 60m0 0l-3 12m3-12l-12 3'), cls: 'spear', glow: '#7ee8e0' }]
  },
  /* 高冠画师 */
  painter: {
    bust: P('M100 94c-10 0-17-8-17-18 0-12 7-20 17-20s17 8 17 20c0 10-7 18-17 18zm-28 16c4-9 14-13 28-13s24 4 28 13c4 9 6 20 6 33v67H66v-67c0-13 2-24 6-33z'),
    hat: P('M92 50h16v-8c10 2 16 8 18 18-16-6-36-6-52 0 2-10 8-16 18-18zm-24 12c20-7 44-7 64 0l-6 6c-16-5-36-5-52 0z'),
    props: [{ d: P('M138 138c10 22 10 44 0 68m0-68c-8 2-12 6-12 12m12-12c8 2 12 6 12 12'), cls: 'brush', glow: '#9be0ff' }]
  },
  /* 裸肩神匠 */
  smith: {
    bust: P('M100 92c-12 0-21-10-21-22s9-22 21-22 21 10 21 22-9 22-21 22zm-36 22c6-11 19-16 36-16s30 5 36 16c4 9 6 20 6 34v62H58v-62c0-14 2-25 6-34z'),
    props: [{ d: P('M40 118l30-14 5 10-28 16z M36 108l10 20'), cls: 'ln' }, { d: P('M34 96l14 28-12 6-12-24z'), cls: 'blade', glow: '#c9a06b' }]
  },
  /* 拄杖盗圣 */
  cripple: {
    bust: P('M100 96c-10 0-18-8-18-19 0-12 8-21 18-21s18 9 18 21c0 11-8 19-18 19zm-28 16c4-9 14-13 28-13s24 4 28 13c4 9 6 20 6 33v65H66v-65c0-13 2-24 6-33z'),
    hat: P('M78 74c6-9 13-13 22-13s16 4 22 13c-14 5-30 5-44 0z'),
    props: [{ d: P('M64 214l14-84m0 0l-6 3m6-3l1 7'), cls: 'ln' }]
  },
  /* 药师：背篓葫芦 */
  herb: {
    bust: P('M100 94c-10 0-18-8-18-19 0-12 8-21 18-21s18 9 18 21c0 11-8 19-18 19zm-28 16c4-9 14-13 28-13s24 4 28 13c4 9 6 20 6 33v67H66v-67c0-13 2-24 6-33z'),
    hat: P('M74 72c8-12 16-18 26-18s18 6 26 18c-17 6-35 6-52 0z'),
    props: [{ d: P('M138 160c-10 0-16-8-16-17s7-15 16-15 16 6 16 15-6 17-16 17zm-4-32v-6h8v6'), cls: 'gourd', glow: '#8fe07a' }]
  },
  /* 赌鬼：掷骰 */
  gambler: {
    bust: P('M100 96c-10 0-18-8-18-19 0-12 8-21 18-21s18 9 18 21c0 11-8 19-18 19zm-28 16c4-9 14-13 28-13s24 4 28 13c4 9 6 20 6 33v65H66v-65c0-13 2-24 6-33z'),
    hat: P('M80 70h40l6 12H74z M88 70c2-8 7-12 12-12s10 4 12 12'),
    props: [{ d: 'M138 150l16 6-6 16-16-6zM142 156l2 2m6-0.5l2 2m-6 7l2 2', cls: 'dice', glow: '#ffd0a0' }]
  },
  /* 狐耳少女 */
  foxgirl: {
    bust: P('M100 96c-10 0-18-8-18-19 0-12 8-21 18-21s18 9 18 21c0 11-8 19-18 19zm-27 16c4-9 14-13 27-13s23 4 27 13c4 9 6 20 6 33v65H67v-65c0-13 2-24 6-33z'),
    hair: P('M100 54c-12 0-20 8-22 19 4-6 10-9 15-9-1 2-1 4 0 6 3-3 13-4 19 1 5-4 9-3 12 2-2-11-11-19-24-19z'),
    props: [
      { d: P('M80 62C74 52 72 42 74 32c5 5 12 9 20 10z'), cls: 'fox', glow: '#ffb0d0' },
      { d: P('M120 62c6-10 8-20 6-30-5 5-12 9-20 10z'), cls: 'fox', glow: '#ffb0d0' }
    ]
  },
  /* 冕旒帝王 */
  emperor: {
    bust: P('M100 96c-11 0-19-9-19-20s8-20 19-20 19 9 19 20-8 20-19 20zm-30 16c5-9 15-14 30-14s25 5 30 14c4 9 6 20 6 33v65H64v-65c0-13 2-24 6-33z'),
    hat: P('M82 60h36v-10h-36zm36 0l16 6-16 4zm-36 0l-16 6 16 4z M82 50l-14-6m46 6l14-6'),
    props: [{ d: P('M64 74h-8m152 0h-8'), cls: '' }]
  },
  /* 持卷国师 */
  preceptor: {
    bust: P('M100 94c-10 0-18-8-18-19 0-12 8-21 18-21s18 9 18 21c0 11-8 19-18 19zm-28 16c4-9 14-13 28-13s24 4 28 13c4 9 6 20 6 33v67H66v-67c0-13 2-24 6-33z'),
    hat: P('M90 56c4-10 8-16 10-16s6 6 10 16c4 10 6 16 6 20-10-6-22-6-32 0 0-4 2-10 6-20z'),
    props: [{ d: P('M128 148l30 8v46l-30-8z M158 156l6 2v46l-6-2'), cls: 'scroll', glow: '#6fb7ff' }]
  },
  /* 披发魔主 */
  cultlord: {
    bust: P('M100 92c-11 0-20-9-20-20s9-21 20-21 20 10 20 21-9 20-20 20zm-30 18c5-9 15-14 30-14s25 5 30 14c4 9 6 20 6 33v67H64v-67c0-13 2-24 6-33z'),
    hair: P('M100 50c-14 0-24 10-26 24 5-8 12-12 19-13-3 4-4 8-3 13 4-6 10-9 17-9 8 0 14 4 18 9 2-6 1-11-2-14 7 2 12 7 15 14-3-14-14-24-26-24z'),
    props: [{ d: P('M64 66C56 78 54 92 58 106m72-40c8 12 10 26 6 40'), cls: 'mist' }]
  },
  /* 负手高人 */
  patriarch: {
    bust: P('M100 94c-10 0-18-8-18-19 0-12 8-21 18-21s18 9 18 21c0 11-8 19-18 19zm-28 16c4-9 14-13 28-13s24 4 28 13c4 9 6 20 6 33v67H66v-67c0-13 2-24 6-33z'),
    hat: P('M84 58c2-12 8-18 16-18s14 6 16 18c-10-4-22-4-32 0zm-8 4c14-6 34-6 48 0l-5 6c-12-4-26-4-38 0z'),
    props: [{ d: P('M148 190c8-6 10-16 6-30'), cls: 'ln' }]
  },
  /* 持剑披风人皇 */
  sovereign: {
    bust: P('M100 92c-11 0-20-9-20-20s9-21 20-21 20 10 20 21-9 20-20 20zm-30 18c5-9 15-14 30-14s25 5 30 14c4 9 6 20 6 33v67H64v-67c0-13 2-24 6-33z'),
    props: [
      { d: P('M64 108c-12 22-14 52-8 84m84-84c12 22 14 52 8 84'), cls: 'cloak' },
      { d: P('M42 200l10-88 6 1-8 88z M52 112l-8-4 4-10 8 6z'), cls: 'sword', glow: '#f5cf6b' }
    ]
  },
  /* 龙首人身 */
  dragonhead: {
    bust: P('M100 100c-8 0-14-6-14-14 0-5 2-9 6-11-3-2-5-6-5-10 0-9 6-15 13-15s13 6 13 15c0 4-2 8-5 10 4 2 6 6 6 11 0 8-6 14-14 14zm-30 12c5-9 15-13 30-13s25 4 30 13c4 9 6 20 6 34v64H64v-64c0-14 2-25 6-34z'),
    props: [
      { d: P('M86 62L70 40m16 10l-4-22m26 22l16-22m-22 10l4-22'), cls: 'horn', glow: '#5fd4b0' },
      { d: P('M78 84c8 6 36 6 44 0m-44 0c0 0 22 4 44 0'), cls: '' }
    ]
  },
  /* 地母：环抱 */
  mother: {
    bust: P('M100 92c-11 0-20-9-20-20s9-21 20-21 20 10 20 21-9 20-20 20zm-30 18c5-9 15-14 30-14s25 5 30 14c4 9 6 20 6 33v67H64v-67c0-13 2-24 6-33z'),
    props: [
      { d: P('M62 130c-8 26 6 52 38 64m38-64c8 26-6 52-38 64'), cls: 'ln' },
      { d: P('M100 40l4 8 8 4-8 4-4 8-4-8-8-4 8-4z'), cls: 'spark', glow: '#8fd4a0' }
    ]
  },
  /* 指天狂人 */
  skypointer: {
    bust: P('M100 94c-10 0-18-8-18-19 0-12 8-21 18-21s18 9 18 21c0 11-8 19-18 19zm-28 16c4-9 14-13 28-13s24 4 28 13c4 9 6 20 6 33v67H66v-67c0-13 2-24 6-33z'),
    props: [{ d: P('M136 128l28-64m0 0l-10 4m10-4l-2 11'), cls: 'ln', glow: '#e0d6ff' }]
  },
  /* 牛角巨影（土伯） */
  ox: {
    bust: P('M100 86c-13 0-24-11-24-25 0-15 11-27 24-27s24 12 24 27c0 14-11 25-24 25zm-34 26c6-11 18-16 34-16s28 5 34 16c4 9 6 21 6 36v62H60v-62c0-15 2-27 6-36z'),
    props: [
      { d: P('M76 46C62 40 52 30 50 14c12 4 24 4 34-2'), cls: 'horn', glow: '#7ee8a0' },
      { d: P('M124 46c14-6 24-16 26-32-12 4-24 4-34-2'), cls: 'horn', glow: '#7ee8a0' }
    ]
  },
  /* 垂目华盖（后土） */
  veil: {
    bust: P('M100 94c-10 0-18-8-18-19 0-12 8-21 18-21s18 9 18 21c0 11-8 19-18 19zm-28 16c4-9 14-13 28-13s24 4 28 13c4 9 6 20 6 33v67H66v-67c0-13 2-24 6-33z'),
    props: [
      { d: P('M56 74c12-20 26-30 44-30s32 10 44 30c-30-10-58-10-88 0z'), cls: 'canopy', glow: '#a0e8c0' },
      { d: P('M56 74l-4 12m92-12l4 12m-48-44v-14'), cls: 'ln' }
    ]
  },
  /* 高冠宫主（弥罗宫主） */
  crownlord: {
    bust: P('M100 92c-11 0-20-9-20-20s9-21 20-21 20 10 20 21-9 20-20 20zm-32 18c5-9 16-14 32-14s27 5 32 14c4 9 6 21 6 35v65H62v-65c0-14 2-26 6-35z'),
    props: [
      { d: P('M84 56l4-22 6 12 6-18 6 18 6-12 4 22z'), cls: 'crown', glow: '#b39dff' },
      { d: P('M62 118c-10 30-10 62 0 96m76-96c10 30 10 62 0 96'), cls: 'ln' }
    ]
  }
}

const HAIRLESS = new Set(['stretcher', 'strawhat', 'painter', 'gambler', 'dragonhead', 'ox', 'crownlord', 'skypointer', 'veil', 'halfman', 'cripple'])

/* 人物立绘 SVG（皮影剪影 + 鎏金描边 + 大字底纹 + 印章） */
export function svgPortrait(ch) {
  const c = ch.color || '#f5cf6b'
  const glyph = ch.name.replace(/^开皇 · /, '').charAt(0)
  const bust = BUSTS[ch.sil] || BUSTS.youth
  const uid = ch.id
  const props = (bust.props || []).map((p, i) =>
    `<path d="${p.d}" class="pp ${p.cls || ''}" style="--pc:${p.glow || c}" stroke-dasharray="${p.cls === 'ln' ? 'none' : 'none'}"/>`).join('')
  return `
<svg class="portrait" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${ch.name}">
  <defs>
    <radialGradient id="pg-${uid}" cx="50%" cy="34%" r="70%">
      <stop offset="0%" stop-color="${c}" stop-opacity=".22"/>
      <stop offset="55%" stop-color="${c}" stop-opacity=".05"/>
      <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="pl-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity=".55"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="196" height="236" rx="6" fill="#0a0d15"/>
  <rect x="2" y="2" width="196" height="236" rx="6" fill="url(#pg-${uid})"/>
  <circle cx="100" cy="96" r="66" fill="none" stroke="${c}" stroke-opacity=".28" stroke-width="1"/>
  <circle cx="100" cy="96" r="74" fill="none" stroke="${c}" stroke-opacity=".14" stroke-width="1" stroke-dasharray="3 7"/>
  <text x="100" y="120" text-anchor="middle" class="pglyph" fill="${c}" opacity=".13">${glyph}</text>
  <g class="sil">
    <path d="${bust.bust}" class="bust" style="--pc:${c}"/>
    ${bust.hat ? `<path d="${bust.hat}" class="bust" style="--pc:${c}"/>` : ''}
    ${(!HAIRLESS.has(ch.sil) && bust.hair) ? `<path d="${bust.hair}" class="bust" style="--pc:${c}"/>` : ''}
    ${props}
  </g>
  <rect x="2" y="142" width="196" height="96" fill="url(#pl-${uid})"/>
  <text x="16" y="222" class="pname" fill="#efe6cf">${ch.name}</text>
  <g transform="translate(164,206)">
    <rect x="-14" y="-14" width="28" height="28" rx="3" fill="#a83226" opacity=".92"/>
    <text x="0" y="6" text-anchor="middle" class="pseal">${glyph}</text>
  </g>
  <rect x="2" y="2" width="196" height="236" rx="6" fill="none" stroke="${c}" stroke-opacity=".35"/>
  <path d="M2 26V8a6 6 0 0 1 6-6h18M178 2h18a6 6 0 0 1 6 6v18M196 214v18a6 6 0 0 1-6 6h-18M22 238H8a6 6 0 0 1-6-6v-18" fill="none" stroke="${c}" stroke-opacity=".8" stroke-width="1.6"/>
</svg>`
}

/* 势力徽记 */
export function svgCrest(f) {
  return `
<svg viewBox="0 0 100 100" class="crest" aria-hidden="true">
  <circle cx="50" cy="50" r="46" fill="#0a0d15" stroke="${f.color}" stroke-opacity=".5"/>
  <circle cx="50" cy="50" r="40" fill="none" stroke="${f.color}" stroke-opacity=".25" stroke-dasharray="4 6"/>
  <text x="50" y="64" text-anchor="middle" class="crest-g" fill="${f.color}">${f.name.charAt(0)}</text>
  <path d="M50 8v10m0 64v10M8 50h10m64 0h10" stroke="${f.color}" stroke-opacity=".6"/>
</svg>`
}

/* 区域小图标（线稿风） */
const ICONS = {
  ruins: 'M12 20V9l3-3 3 3v11m-9-8h9M6 20V12l3-3m-6 11h18',
  city: 'M5 20v-9l7-5 7 5v9m-14-4h14m-10 4v-4h6v4m3-9H8',
  dome: 'M4 20a8 8 0 0 1 16 0m-8-8V6l3 4',
  lotus: 'M12 20c-2-2-3-5-3-8 0-4 3-8 3-8s3 4 3 8c0 3-1 6-3 8zm-6 0c0-3 2-5 4-6m12 6c0-3-2-5-4-6M4 20h16',
  peak: 'M3 20l6-11 4 6 3-4 5 9zm7-11l2-3 2 3',
  palace: 'M4 20v-6l8-6 8 6v6m-16-6h16m-13 0l5-8 5 8M4 20h16',
  gate: 'M6 20V6c0-2 2-3 6-3s6 1 6 3v14m-12-6h12m-9 6v-6m6 6v-6',
  star: 'M12 4l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  village: 'M3 20v-5l4-3 4 3v5m-8 0h8m4 0v-7l3-3 3 3v7m-6 0h8m-9-13v-3',
  ship: 'M4 15h16l-2 4H6zM12 15V4m0 0l7 4-7 4m-6 7h10',
  ark: 'M3 14c3 2.5 15 2.5 18 0l-2.5 5.5h-13zM8 14V6h8v8m-8-3h8m-4-5v5'
}
export function svgRegionIcon(icon, color) {
  return `
<svg viewBox="0 0 24 24" class="ricon" aria-hidden="true">
  <path d="${ICONS[icon] || ICONS.star}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
}

/* 回纹横带（CSS 不可表达的复杂纹样用 SVG） */
export function meander(width = 240, color = '#f5cf6b') {
  const unit = 16
  const n = Math.ceil(width / unit)
  let d = ''
  for (let i = 0; i < n; i++) {
    const x = i * unit
    d += `M${x} 12h${unit - 4}v-8h${-(unit - 8)}v4h${unit - 12} `
  }
  return `<svg width="${width}" height="16" viewBox="0 0 ${width} 16" class="meander" aria-hidden="true"><path d="${d}" fill="none" stroke="${color}" stroke-width="1.4" opacity=".8"/></svg>`
}
