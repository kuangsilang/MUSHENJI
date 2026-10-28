/* ============================================================
 * 3D 引擎：渲染器 / Bloom 后期 / 场景切换 / 相机补间 / 标签投影 / 贴图工具
 * ============================================================ */
import * as THREE from 'three'
import { EffectComposer } from './lib/three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from './lib/three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from './lib/three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from './lib/three/examples/jsm/postprocessing/OutputPass.js'

export const isMobile = matchMedia('(pointer:coarse)').matches || innerWidth < 720

export class Engine {
  constructor(canvas) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 1.75))
    this.renderer.setSize(innerWidth, innerHeight)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.12

    this.composer = new EffectComposer(this.renderer)
    this.renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera())
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), isMobile ? 0.75 : 0.9, 0.55, 0.62)
    this.composer.addPass(this.renderPass)
    this.composer.addPass(new OutputPass())

    this.scenes = {}
    this.active = null
    this.clock = new THREE.Clock()
    this.tweens = []
    this.raycaster = new THREE.Raycaster()
    this.pointerNDC = new THREE.Vector2(0, 0)
    this.dragging = false

    addEventListener('resize', () => this.resize())
    canvas.addEventListener('pointerdown', (e) => {
      this.dragging = true; this.moved = 0
      this._last = { x: e.clientX, y: e.clientY }
      canvas.setPointerCapture?.(e.pointerId)
      this.active?.onDown?.(e, this._ndc(e))
    })
    canvas.addEventListener('pointermove', (e) => {
      const ndc = this._ndc(e)
      const dx = this._last ? e.clientX - this._last.x : 0
      const dy = this._last ? e.clientY - this._last.y : 0
      this._last = { x: e.clientX, y: e.clientY }
      if (this.dragging) this.moved += Math.abs(dx) + Math.abs(dy)
      this.active?.onMove?.(e, ndc, this.dragging, dx, dy)
    })
    canvas.addEventListener('pointerup', (e) => {
      this.dragging = false
      this._last = null
      this.active?.onUp?.(e, this._ndc(e), this.moved < 6)
    })
    canvas.addEventListener('pointercancel', () => { this.dragging = false; this._last = null })
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault()
      this.active?.onWheel?.(e)
    }, { passive: false })

    this.renderer.setAnimationLoop(() => this._frame())
  }

  _ndc(e) {
    this.pointerNDC.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1)
    return this.pointerNDC
  }

  register(name, def) { this.scenes[name] = def }

  async switchTo(name) {
    const next = this.scenes[name]
    if (!next || this.active === next) return
    const prev = this.active
    if (prev) { prev.exit?.(); prev.root.visible = false }
    this.active = next
    next.root.visible = true
    this.renderPass.scene = next.scene
    this.renderPass.camera = next.camera
    next.enter?.()
    this.resize()
  }

  resize() {
    this.renderer.setSize(innerWidth, innerHeight)
    this.composer.setSize(innerWidth, innerHeight)
    for (const s of Object.values(this.scenes)) {
      s.camera.aspect = innerWidth / innerHeight
      s.camera.updateProjectionMatrix()
      s.onResize?.(innerWidth, innerHeight)
    }
  }

  tween(setter, to, dur = 1.2, ease = easeInOutCubic, onDone) {
    const tw = { setter, from: null, to, t0: performance.now(), dur: dur * 1000, ease, onDone }
    this.tweens.push(tw)
    return tw
  }

  _frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05)
    const t = this.clock.elapsedTime
    const now = performance.now()
    this.tweens = this.tweens.filter((tw) => {
      if (tw.from === null) tw.from = tw.setter()
      const k = Math.min((now - tw.t0) / tw.dur, 1)
      tw.setter(tw.from + (tw.to - tw.from) * tw.ease(k))
      if (k >= 1) { tw.onDone?.(); return false }
      return true
    })
    if (this.active) {
      this.active.update?.(t, dt)
      this.composer.render()
    }
  }

  pick(ndc, objects) {
    this.raycaster.setFromCamera(ndc, this.active.camera)
    return this.raycaster.intersectObjects(objects, false)[0] || null
  }
}

export const easeInOutCubic = (k) => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
export const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3)

/* ---------- 贴图工具 ---------- */
export function glowTexture(color = '#ffd76b', inner = 0.08) {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(64, 64, 64 * inner, 64, 64, 64)
  grad.addColorStop(0, color); grad.addColorStop(0.25, color + 'cc'); grad.addColorStop(1, 'transparent')
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function textTexture(text, { font = '"Ma Shan Zheng Local","Ma Shan Zheng","KaiTi",serif', color = '#f5cf6b', size = 96, pad = 40, vertical = false } = {}) {
  const cv = document.createElement('canvas')
  const g = cv.getContext('2d')
  g.font = `${size}px ${font}`
  const w = Math.ceil((vertical ? size : g.measureText(text).width) + pad * 2)
  const h = Math.ceil((vertical ? text.length * size * 1.15 : size * 1.4) + pad)
  cv.width = w; cv.height = h
  const g2 = cv.getContext('2d')
  g2.font = `${size}px ${font}`
  g2.textAlign = 'center'; g2.textBaseline = 'middle'
  g2.shadowColor = color; g2.shadowBlur = 18
  g2.fillStyle = color
  const chars = vertical ? [...text] : [text]
  chars.forEach((ch, i) => {
    const x = vertical ? w / 2 : w / 2
    const y = vertical ? pad / 2 + size * (0.575 + i * 1.15) : h / 2
    g2.fillText(ch, x, y)
  })
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return { tex, aspect: w / h }
}

/* 剪影画布：man(凡人) / god(神影) */
export function silhouetteTexture(kind) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 512
  const g = cv.getContext('2d')
  g.fillStyle = 'rgba(4,5,9,0.96)'
  if (kind === 'man') {
    g.beginPath(); g.arc(128, 96, 34, 0, Math.PI * 2); g.fill()                    // 头
    g.beginPath(); g.moveTo(80, 512); g.quadraticCurveTo(84, 190, 128, 132)
    g.quadraticCurveTo(172, 190, 176, 512); g.closePath(); g.fill()                 // 袍身
    g.fillRect(118, 128, 20, 70)                                                    // 颈胸
  } else {
    // 巨神：冕旒 + 广袖 + 山峦般的袍身
    g.beginPath()
    g.moveTo(48, 512)
    g.quadraticCurveTo(60, 240, 104, 196)
    g.lineTo(96, 170); g.quadraticCurveTo(112, 150, 128, 148)
    g.quadraticCurveTo(144, 150, 160, 170); g.lineTo(152, 196)
    g.quadraticCurveTo(196, 240, 208, 512)
    g.closePath(); g.fill()
    g.beginPath(); g.arc(128, 118, 34, 0, Math.PI * 2); g.fill()
    for (let i = 0; i < 7; i++) {                                                   // 冕旒尖刺
      const x = 78 + i * 17
      g.beginPath(); g.moveTo(x, 92); g.lineTo(x + 6, 30 + Math.abs(i - 3) * 12); g.lineTo(x + 12, 92); g.closePath(); g.fill()
    }
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/* 星点云 */
export function makeStars(count, spread, colorSet, sizeRange = [0.6, 1.8]) {
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const phase = new Float32Array(count)
  const c = new THREE.Color()
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread[0]
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread[1]
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread[2]
    c.set(colorSet[(Math.random() * colorSet.length) | 0])
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
    phase[i] = Math.random() * Math.PI * 2
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScale: { value: 1 } },
    vertexShader: `
      attribute vec3 aColor; attribute float aPhase;
      varying vec3 vC; varying float vA;
      uniform float uTime; uniform float uScale;
      void main(){
        vC = aColor;
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        float tw = 0.55 + 0.45*sin(uTime*1.4 + aPhase);
        vA = tw;
        gl_PointSize = ${JSON.stringify(0)} + (mix(${sizeRange[0].toFixed(1)}, ${sizeRange[1].toFixed(1)}, fract(aPhase*7.13)) * uScale * tw) * (140.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vC; varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.08, d) * vA;
        gl_FragColor = vec4(vC, a);
      }`
  })
  const pts = new THREE.Points(geo, mat)
  pts.userData.shader = mat
  return pts
}

/* 萤火粒子（大墟之火） */
export function makeFireflies(count, box, colors) {
  const pos = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  const col = new Float32Array(count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < count; i++) {
    pos[i * 3] = box[0] + Math.random() * (box[1] - box[0])
    pos[i * 3 + 1] = box[2] + Math.random() * (box[3] - box[2])
    pos[i * 3 + 2] = box[4] + Math.random() * (box[5] - box[4])
    seed[i] = Math.random() * 100
    c.set(colors[(Math.random() * colors.length) | 0])
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uMouse: { value: new THREE.Vector3(9999, 9999, 0) } },
    vertexShader: `
      attribute float aSeed; attribute vec3 aColor;
      varying vec3 vC; varying float vA; uniform float uTime; uniform vec3 uMouse;
      void main(){
        vC = aColor;
        vec3 p = position;
        p.x += sin(uTime*0.28 + aSeed)*1.6;
        p.y += sin(uTime*0.42 + aSeed*1.7)*1.1 + uTime*0.14 - floor(uTime*0.14/6.0)*6.0;
        p.z += cos(uTime*0.22 + aSeed*0.9)*1.2;
        vec3 toM = uMouse - p;
        float d = length(toM);
        p += normalize(toM + 0.0001) * smoothstep(10.0, 0.0, d) * 2.2;
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        float fl = 0.35 + 0.65*pow(0.5+0.5*sin(uTime*2.2 + aSeed*3.1), 2.0);
        vA = fl;
        gl_PointSize = (1.4 + 1.8*fract(aSeed*0.37)) * fl * (120.0/-mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vC; varying float vA;
      void main(){
        float d = length(gl_PointCoord-0.5);
        gl_FragColor = vec4(vC, smoothstep(0.5,0.05,d)*vA);
      }`
  })
  const pts = new THREE.Points(geo, mat)
  pts.userData.shader = mat
  return pts
}

/* 标签投影：把 3D 坐标转成 HTML 标签位置（出画时吸附视口边缘，仅背面隐藏） */
export function placeLabel(el, v3, camera, w, h, hideBehind = true) {
  _v.copy(v3).project(camera)
  if (_v.z > 1) { el.style.opacity = '0'; el.style.pointerEvents = 'none'; return false }
  const x = (_v.x * 0.5 + 0.5) * w
  const y = (-_v.y * 0.5 + 0.5) * h
  if (x < -80 || x > w + 80 || y < -80 || y > h + 80) {
    el.style.opacity = '0'; el.style.pointerEvents = 'none'; return false
  }
  el.style.opacity = ''
  el.style.pointerEvents = ''
  const cx = Math.min(Math.max(x, 26), w - 26)
  const cy = Math.min(Math.max(y, 34), h - 26)
  el.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px) translate(-50%, -120%)`
  return true
}
const _v = new THREE.Vector3()

/* 山脊剪影几何 */
export function ridgeGeometry(width, baseY, amp, segs, seed) {
  const shape = new THREE.Shape()
  shape.moveTo(-width / 2, baseY - 12)
  let rnd = seed
  const rand = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647
  const pts = []
  for (let i = 0; i <= segs; i++) {
    const x = -width / 2 + (width * i) / segs
    const env = Math.sin((i / segs) * Math.PI)
    const k = i / segs
    const y = baseY + amp * env * (
      0.34 + 0.34 * Math.sin(k * 9.3 + seed) +
      0.20 * Math.sin(k * 19.7 + seed * 2.1) +
      0.12 * Math.sin(k * 37.3 + seed * 3.3)
    )
    pts.push([x, y])
    shape.lineTo(x, y)
  }
  shape.lineTo(width / 2, baseY - 12)
  const geo = new THREE.ShapeGeometry(shape)
  geo.userData.crest = pts
  return geo
}
