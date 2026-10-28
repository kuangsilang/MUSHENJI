/* ============================================================
 * 序章 · 大墟之夜：远山如墨、孤月金乌、太阳船渡夜、萤火升腾
 * ============================================================ */
import * as THREE from 'three'
import { makeStars, makeFireflies, ridgeGeometry, glowTexture, isMobile } from '../engine.js'

const _ray = new THREE.Raycaster()
const _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 4)
const _hit = new THREE.Vector3()

export function createHero(eng, ctx) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#04060c')
  scene.fog = new THREE.FogExp2('#05070e', 0.014)

  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 400)
  camera.position.set(0, 2.2, 30)

  const root = new THREE.Group()
  scene.add(root)

  /* 星空 */
  const stars = makeStars(isMobile ? 500 : 900, [260, 130, 160], ['#cfe4ff', '#ffe9c4', '#9fd8ff', '#ffffff'])
  stars.position.set(0, 20, -80)
  root.add(stars)

  /* 金月（金乌坠夜） */
  const moonTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256
    const g = cv.getContext('2d')
    const grad = g.createRadialGradient(128, 128, 30, 128, 128, 128)
    grad.addColorStop(0, '#ffe9b0'); grad.addColorStop(0.55, '#f2c96a'); grad.addColorStop(0.85, '#c98f3a'); grad.addColorStop(1, '#8a5a20')
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256)
    g.globalAlpha = 0.16; g.fillStyle = '#7a4a16'
    let s = 7
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
    for (let i = 0; i < 22; i++) {
      g.beginPath(); g.arc(40 + rnd() * 176, 40 + rnd() * 176, 4 + rnd() * 16, 0, Math.PI * 2); g.fill()
    }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace
    return t
  })()
  const moon = new THREE.Mesh(
    new THREE.CircleGeometry(9, 64),
    new THREE.MeshBasicMaterial({ map: moonTex, transparent: true, fog: false })
  )
  moon.position.set(-17, 14.5, -55)
  root.add(moon)
  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture('#f2c96a'), transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, fog: false
  }))
  moonHalo.scale.setScalar(46)
  moonHalo.position.copy(moon.position); moonHalo.position.z -= 1
  root.add(moonHalo)

  /* 远山如墨（四层） */
  const layers = [
    { z: -46, amp: 13, base: -1.5, col: '#0a0e18', rim: true, w: 190 },
    { z: -34, amp: 10.5, base: -3, col: '#080b13', w: 180 },
    { z: -22, amp: 8, base: -4.5, col: '#060910', w: 170 },
    { z: -10, amp: 5.6, base: -5.8, col: '#04060b', w: 160 }
  ]
  layers.forEach((L, i) => {
    const geo = ridgeGeometry(L.w, L.base, L.amp, 90, 11 + i * 37)
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: L.col, fog: true }))
    m.position.z = L.z
    root.add(m)
    if (L.rim) {
      const crest = geo.userData.crest
      const pts = crest.map((p) => new THREE.Vector3(p[0], p[1] + 0.08, 0))
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: '#f5cf6b', transparent: true, opacity: 0.2, fog: true }))
      line.position.z = L.z
      root.add(line)
    }
  })

  /* 残老村：山坡上的三两灯火 */
  const village = new THREE.Group()
  const hut = (x, y, s) => {
    const gp = new THREE.Group()
    gp.add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 1.8), new THREE.MeshBasicMaterial({ color: '#03040a' })))
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.3, 4), new THREE.MeshBasicMaterial({ color: '#03040a' }))
    roof.position.y = 1.35; roof.rotation.y = Math.PI / 4
    gp.add(roof)
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.42),
      new THREE.MeshBasicMaterial({ color: '#ffb45c', transparent: true, opacity: 0.9, fog: false }))
    win.position.set(0, 0.1, 0.92)
    gp.add(win)
    gp.userData.win = win
    gp.position.set(x, y, 0); gp.scale.setScalar(s)
    return gp
  }
  village.add(hut(-10.5, -3.6, 1.0), hut(-7.4, -4.1, 0.8), hut(-13.2, -4.3, 0.7))
  const hill = new THREE.Mesh(ridgeGeometry(60, -4.6, 2.6, 40, 5), new THREE.MeshBasicMaterial({ color: '#030409' }))
  hill.position.set(-10, 0, -6)
  village.add(hill)
  village.position.z = -8
  root.add(village)

  /* 萤火（大墟之火） */
  const fireflies = makeFireflies(isMobile ? 260 : 480, [-55, 55, -7, 12, -16, 2], ['#ffd76b', '#d6ff9b', '#ffe9a0'])
  root.add(fireflies)

  /* 山间雾霭 */
  const mists = []
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture('#1a2338', 0.015), transparent: true, opacity: 0.12, depthWrite: false
    }))
    m.scale.set(34 + i * 9, 7 + i * 2, 1)
    m.position.set(-30 + i * 28, -4.2 + i * 0.8, -14 + i * 4)
    root.add(m)
    mists.push(m)
  }

  /* 天灯（点击放飞）与流星 */
  const lanterns = []
  const meteors = []
  const lanternTex = glowTexture('#ffcf7a', 0.12)
  function spawnLantern(p, size = 1.5, rise = 1) {
    if (lanterns.length > 26) return
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: lanternTex, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, fog: false
    }))
    s.position.set(p.x, Math.max(p.y, -6), -4)
    s.scale.setScalar(size)
    root.add(s)
    lanterns.push({ s, age: 0, seed: Math.random() * 10, size, rise })
    dispatchEvent(new CustomEvent('lantern', { detail: { big: size > 3 } }))
  }
  let hold = null
  function spawnMeteor() {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(3.2, -0.9, 0)])
    const ln = new THREE.Line(g, new THREE.LineBasicMaterial({
      color: '#fff3d0', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, fog: false
    }))
    ln.position.set(-40 + Math.random() * 80, 16 + Math.random() * 8, -48)
    root.add(ln)
    meteors.push({ ln, age: 0 })
  }

  /* 太阳船：金色残焰渡夜空 */
  const ship = new THREE.Group()
  {
    const hullShape = new THREE.Shape()
    hullShape.moveTo(-5.2, 0)
    hullShape.quadraticCurveTo(-5.6, -1.6, -3.6, -2.0)
    hullShape.lineTo(3.6, -2.0)
    hullShape.quadraticCurveTo(6.4, -1.2, 7.4, 0.6)
    hullShape.lineTo(5.6, 0.6)
    hullShape.quadraticCurveTo(3.4, -0.4, -3.6, -0.4)
    hullShape.lineTo(-5.2, 0)
    const hull = new THREE.Mesh(new THREE.ShapeGeometry(hullShape), new THREE.MeshBasicMaterial({ color: '#08090f', fog: false }))
    ship.add(hull)
    const hullEdge = new THREE.LineSegments(new THREE.EdgesGeometry(hull.geometry),
      new THREE.LineBasicMaterial({ color: '#f0b64a', transparent: true, opacity: 0.85, fog: false }))
    ship.add(hullEdge)
    const sail = (w, h, x, y, r) => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: '#120b06', transparent: true, opacity: 0.92, side: THREE.DoubleSide, fog: false }))
      s.position.set(x, y, 0); s.rotation.z = r
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(s.geometry),
        new THREE.LineBasicMaterial({ color: '#c98f3a', transparent: true, opacity: 0.5, fog: false }))
      s.add(e)
      ship.add(s)
    }
    sail(3.2, 2.6, -1.6, 2.1, 0.16)
    sail(2.4, 2.0, 1.5, 1.9, -0.12)
    const flameTex = glowTexture('#ffcf7a', 0.04)
    const flames = []
    for (let i = 0; i < 3; i++) {
      const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, fog: false }))
      f.position.set(-4.6 + i * 0.7, -1.2 + i * 0.22, 0.2)
      f.scale.setScalar(2.2 - i * 0.4)
      ship.add(f); flames.push(f)
    }
    const trail = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, fog: false }))
    trail.scale.set(26, 1.6, 1); trail.position.set(-16, -0.6, -0.5)
    ship.add(trail)
    ship.userData.flames = flames
  }
  ship.scale.setScalar(0.9)
  root.add(ship)

  /* 状态 */
  let px = 0, py = 0, tx = 0, ty = 0, nextMeteor = 4
  const state = {
    scene, camera, root,
    update(t, dt) {
      tx += (px - tx) * 0.04; ty += (py - ty) * 0.04
      camera.position.x = tx * 3.2
      camera.position.y = 2.2 + ty * 1.6 + Math.sin(t * 0.3) * 0.35
      camera.lookAt(0, 2.6, -20)
      stars.userData.shader.uniforms.uTime.value = t
      fireflies.userData.shader.uniforms.uTime.value = t
      moonHalo.material.opacity = 0.42 + Math.sin(t * 0.7) * 0.08
      ship.position.x = -70 + ((t * 4.2) % 150)
      ship.position.y = 10.5 + Math.sin(t * 0.45) * 1.1
      ship.position.z = -30
      ship.rotation.z = Math.sin(t * 0.45 + 1) * 0.045
      ship.userData.flames.forEach((f, i) => {
        const k = 0.8 + Math.sin(t * 6 + i * 2.1) * 0.25
        f.scale.setScalar((2.2 - i * 0.4) * k)
        f.material.opacity = 0.6 + Math.sin(t * 7 + i) * 0.2
      })
      village.children.forEach((c) => {
        if (c.userData.win) c.userData.win.material.opacity = 0.75 + Math.sin(t * 2.3 + c.position.x) * 0.18
      })
      mists.forEach((m, i) => {
        m.position.x += dt * (0.35 + i * 0.12)
        if (m.position.x > 55) m.position.x = -55
      })
      /* 天灯升起 */
      for (let i = lanterns.length - 1; i >= 0; i--) {
        const L = lanterns[i]
        L.age += dt
        L.s.position.y += dt * (1.2 + L.seed * 0.15) * L.rise
        L.s.position.x += Math.sin(L.age * 1.4 + L.seed) * dt * 0.6
        const k = Math.min(L.age * 2, 1)
        L.s.scale.setScalar(L.size + L.age * 0.14)
        L.s.material.opacity = 0.95 * k * Math.max(0, 1 - L.s.position.y / (15 + L.size * 2))
        if (L.s.position.y > 15 + L.size * 1.8) { root.remove(L.s); lanterns.splice(i, 1) }
      }
      /* 蓄力中：灯胚渐胀 */
      if (hold) {
        const age = (performance.now() - hold.t0) / 1000
        hold.sprite.scale.setScalar(Math.min(1.2 + age * 2.3, 7.5))
        hold.sprite.material.opacity = 0.55 + Math.sin(performance.now() * 0.012) * 0.2
      }
      /* 流星 */
      if (t > nextMeteor) { spawnMeteor(); nextMeteor = t + 5 + Math.random() * 6 }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const M = meteors[i]
        M.age += dt
        M.ln.position.x += dt * 30
        M.ln.position.y -= dt * 8.5
        M.ln.material.opacity = Math.max(0, 0.9 - M.age * 1.1)
        if (M.age > 0.85) { root.remove(M.ln); meteors.splice(i, 1) }
      }
    },
    onMove(e, ndc) {
      px = ndc.x; py = ndc.y
      _ray.setFromCamera(ndc, camera)
      if (_ray.ray.intersectPlane(_plane, _hit)) {
        fireflies.userData.shader.uniforms.uMouse.value.copy(_hit)
      }
    },
    onDown(e, ndc) {
      _ray.setFromCamera(ndc, camera)
      if (_ray.ray.intersectPlane(_plane, _hit)) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({
          map: lanternTex, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, fog: false, color: '#ffe2a8'
        }))
        s.position.set(_hit.x, Math.max(_hit.y, -6), -4)
        s.scale.setScalar(1.2)
        root.add(s)
        hold = { pos: _hit.clone(), sprite: s, t0: performance.now() }
      }
    },
    onUp(e, ndc, isClick) {
      if (hold) {
        const charge = Math.min((performance.now() - hold.t0) / 1800, 1)
        if (isClick || charge > 0.5) {
          spawnLantern(hold.pos, 1.5 + charge * 4.5, 0.85 + charge * 0.55)
        }
        root.remove(hold.sprite)
        hold = null
      } else if (isClick) {
        _ray.setFromCamera(ndc, camera)
        if (_ray.ray.intersectPlane(_plane, _hit)) spawnLantern(_hit)
      }
    },
    onResize(w, h) { },
    enter() { camera.position.set(0, 2.2, 30); px = py = tx = ty = 0 }
  }
  return state
}
