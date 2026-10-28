/* ============================================================
 * 山河图 · 诸天万界：玄墨疆域、鎏金城郭、幽都鬼火、天庭高悬
 * ============================================================ */
import * as THREE from 'three'
import { glowTexture, placeLabel, easeInOutCubic, isMobile } from '../engine.js'
import { REGIONS } from '../data.js'

export function createMap(eng, ctx) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#04050b')
  scene.fog = new THREE.FogExp2('#04060c', 0.006)

  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 500)
  const root = new THREE.Group()
  scene.add(root)

  /* 灯光（本场景使用实体材质） */
  const hemi = new THREE.HemisphereLight('#3a4a6a', '#0a0c12', 0.7)
  const dir = new THREE.DirectionalLight('#ffe9c4', 1.1)
  dir.position.set(-30, 50, -20)
  scene.add(hemi, dir)

  /* 玄墨疆域 */
  const W = 150, H = 100, SX = 96, SZ = 64
  const geo = new THREE.PlaneGeometry(W, H, SX, SZ)
  {
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i)
      const edge = Math.max(Math.abs(x) / (W / 2), Math.abs(y) / (H / 2))
      let h = Math.max(0, edge - 0.72) * 46                       // 边缘山环
      h += Math.abs(Math.sin(x * 0.11) * Math.cos(y * 0.13)) * 2.2  // 细皱
      const cx = x / W, cy = y / H
      const basin = Math.exp(-(cx * cx * 26 + cy * cy * 26))       // 中央大墟凹地
      h -= basin * 3.2
      pos.setZ(i, h)
    }
    geo.computeVertexNormals()
  }
  const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: '#11141d', roughness: 0.95, metalness: 0.05, flatShading: true
  }))
  terrain.rotation.x = -Math.PI / 2
  root.add(terrain)

  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(geo),
    new THREE.LineBasicMaterial({ color: '#f5cf6b', transparent: true, opacity: 0.05 })
  )
  wire.rotation.x = -Math.PI / 2
  wire.position.y = 0.05
  root.add(wire)

  /* 高度采样 */
  function groundAt(x, z) {
    const y = z // plane rotated: local y => world -z ; 用近似即可
    const edge = Math.max(Math.abs(x) / (W / 2), Math.abs(y) / (H / 2))
    let h = Math.max(0, edge - 0.72) * 46
    h += Math.abs(Math.sin(x * 0.11) * Math.cos(y * 0.13)) * 2.2
    const cx = x / W, cy = y / H
    h -= Math.exp(-(cx * cx * 26 + cy * cy * 26)) * 3.2
    return h
  }

  /* 区域布点 */
  const layout = {
    'daxu': [0, 4], 'canlao': [-9, 11], 'taiyang': [11, 15], 'bi_an': [-15, -8],
    'yankang': [34, -20], 'didu': [41, -11], 'wuyou': [-46, -30], 'xitu': [-46, 16],
    'zuting': [10, -38], 'tianting': [0, -6], 'youdu': [18, 34], 'miluo': [-52, 6]
  }
  const markHeight = {
    'daxu': 7, 'canlao': 4, 'taiyang': 5, 'bi_an': 6, 'yankang': 6, 'didu': 8,
    'wuyou': 5, 'xitu': 5.5, 'zuting': 10, 'tianting': 15, 'youdu': 5, 'miluo': 20
  }

  const groups = {}
  const markers = []
  const pickables = []
  const matDark = () => new THREE.MeshStandardMaterial({ color: '#0b0e15', roughness: 0.9, metalness: 0.2 })

  function buildMarker(r) {
    const [x, z] = layout[r.id]
    const base = groundAt(x, z)
    const g = new THREE.Group()
    const h = markHeight[r.id]
    const col = new THREE.Color(r.color)

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, h, 8),
      new THREE.MeshBasicMaterial({ color: r.color, transparent: true, opacity: 0.5 }))
    pillar.position.y = h / 2
    g.add(pillar)

    let icon = null
    if (r.id === 'daxu') {
      icon = new THREE.Group()
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.5 + Math.random() * 0.4, 2.4 + Math.random() * 2, 5),
          new THREE.MeshStandardMaterial({ color: '#05060c', roughness: 1 }))
        spike.position.set((Math.random() - 0.5) * 3.4, 1.2, (Math.random() - 0.5) * 3.4)
        spike.rotation.z = (Math.random() - 0.5) * 0.4
        icon.add(spike)
      }
      /* 残垣断门 */
      const ruin = new THREE.Group()
      const rgeo = new THREE.BoxGeometry(0.4, 2.2, 0.4)
      const rmat = new THREE.MeshStandardMaterial({ color: '#080a12', roughness: 1 })
      const rq1 = new THREE.Mesh(rgeo, rmat); rq1.position.set(-1.1, 1.1, 1.6); rq1.rotation.z = 0.12
      const rq2 = new THREE.Mesh(rgeo, rmat); rq2.position.set(1.1, 0.9, 1.6); rq2.rotation.z = -0.3
      const rl = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.45), rmat); rl.position.set(-0.3, 2.15, 1.6); rl.rotation.z = 0.2
      ruin.add(rq1, rq2, rl)
      ;[rq1, rq2, rl].forEach((m) => {
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: '#8f7cff', transparent: true, opacity: 0.7 }))
        e.position.copy(m.position); e.rotation.copy(m.rotation)
        ruin.add(e)
      })
      icon.add(ruin)
      const mist = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#4a2a7a', 0.02), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }))
      mist.scale.setScalar(9)
      icon.add(mist)
    } else if (r.id === 'canlao') {
      /* 残老村：三座亮着灯火的茅屋 */
      icon = new THREE.Group()
      for (let i = 0; i < 3; i++) {
        const hut = new THREE.Group()
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 1.2), new THREE.MeshStandardMaterial({ color: '#0a0a0e', roughness: 1 }))
        const roof = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.8, 4), new THREE.MeshStandardMaterial({ color: '#0d0b08', roughness: 1 }))
        roof.position.y = 0.8; roof.rotation.y = Math.PI / 4
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.34),
          new THREE.MeshBasicMaterial({ color: '#ffb45c', transparent: true, opacity: 0.95 }))
        win.position.set(0, 0.05, 0.62)
        const lg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#ffb45c'), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }))
        lg.scale.setScalar(2.2)
        hut.add(body, roof, win, lg)
        hut.position.set((i - 1) * 2.2, 0.45, (i % 2) * 1.4 - 0.7)
        hut.rotation.y = i * 0.5
        icon.add(hut)
        icon.userData.wins = (icon.userData.wins || []).concat(win)
      }
    } else if (r.id === 'taiyang') {
      /* 太阳船遗迹：半埋的金色巨舟 */
      icon = new THREE.Group()
      const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: '#171006', roughness: 0.5, metalness: 0.6, emissive: '#f0b64a', emissiveIntensity: 0.3 }))
      hull.scale.set(3.4, 1.6, 1.1)
      hull.rotation.z = 0.35
      hull.position.y = 0.9
      const prow = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.8, 6),
        new THREE.MeshStandardMaterial({ color: '#171006', roughness: 0.5, metalness: 0.6, emissive: '#f0b64a', emissiveIntensity: 0.35 }))
      prow.position.set(3.2, 1.7, 0); prow.rotation.z = -2.2
      const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#f0b64a'), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }))
      flame.scale.set(3, 3, 1); flame.position.set(-2.6, 1.2, 0)
      icon.add(hull, prow, flame)
      icon.userData.fire = flame
    } else if (r.id === 'bi_an') {
      /* 彼岸方舟：幽光巨舰 */
      icon = new THREE.Group()
      const ark = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.1, 1.8),
        new THREE.MeshStandardMaterial({ color: '#0a1013', roughness: 0.6, metalness: 0.5 }))
      ark.position.y = 0.8; ark.rotation.z = 0.08
      const keel = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.6, 4),
        new THREE.MeshStandardMaterial({ color: '#0a1013', roughness: 0.6, metalness: 0.5 }))
      keel.position.set(2.6, 1.4, 0); keel.rotation.z = -Math.PI / 2 + 0.15
      icon.add(ark, keel)
      ;[ark, keel].forEach((m) => {
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: '#7ee8e0', transparent: true, opacity: 0.75 }))
        e.position.copy(m.position); e.rotation.copy(m.rotation)
        icon.add(e)
      })
      const rune = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#7ee8e0'), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))
      rune.scale.set(5.5, 2.2, 1); rune.position.set(0, 1, 0)
      icon.add(rune)
      icon.userData.rune = rune
    } else if (r.id === 'yankang') {
      icon = new THREE.Group()
      for (let i = 0; i < 5; i++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(1.1 + Math.random(), 1.4 + Math.random() * 1.8, 1.1), matDark())
        b.position.set((Math.random() - 0.5) * 3.4, 0.8, (Math.random() - 0.5) * 3)
        icon.add(b)
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(b.geometry), new THREE.LineBasicMaterial({ color: '#62a8ff', transparent: true, opacity: 0.8 }))
        e.position.copy(b.position)
        icon.add(e)
      }
      const tower = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3, 6), matDark())
      tower.position.y = 2.6; icon.add(tower)
    } else if (r.id === 'wuyou') {
      icon = new THREE.Mesh(new THREE.SphereGeometry(2.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: '#141109', roughness: 0.6, metalness: 0.4, emissive: '#f5cf6b', emissiveIntensity: 0.25 }))
      icon.scale.y = 0.62
    } else if (r.id === 'xitu') {
      icon = new THREE.Group()
      for (let i = 0; i < 6; i++) {
        const petal = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.6, 5),
          new THREE.MeshStandardMaterial({ color: '#1a130a', roughness: 0.7, emissive: '#ffd9a0', emissiveIntensity: 0.22 }))
        const a = (i / 6) * Math.PI * 2
        petal.position.set(Math.cos(a) * 1.1, 1.1, Math.sin(a) * 1.1)
        petal.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5)
        icon.add(petal)
      }
      const heart = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#ffd9a0'), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }))
      heart.scale.setScalar(3.4); heart.position.y = 1
      icon.add(heart)
    } else if (r.id === 'zuting') {
      icon = new THREE.Group()
      const up = new THREE.Mesh(new THREE.ConeGeometry(2.2, 4.4, 6), matDark())
      up.position.y = 2.2
      const down = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.4, 6), matDark())
      down.rotation.x = Math.PI; down.position.y = -1.4
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.05, 8, 48),
        new THREE.MeshBasicMaterial({ color: '#9be0ff', transparent: true, opacity: 0.8 }))
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.4
      icon.add(up, down, ring)
      icon.userData.ring = ring
    } else if (r.id === 'tianting') {
      icon = new THREE.Group()
      const tiers = [[4.4, 0.5, 0], [3.2, 0.5, 0.9], [2.2, 0.5, 1.8]]
      tiers.forEach(([w, hh, y]) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, w * 0.7),
          new THREE.MeshStandardMaterial({ color: '#141318', roughness: 0.5, metalness: 0.4, emissive: '#f0e6c8', emissiveIntensity: 0.2 }))
        m.position.y = y + 0.25
        icon.add(m)
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: '#f0e6c8', transparent: true, opacity: 0.9 }))
        e.position.copy(m.position)
        icon.add(e)
      })
      const cloud = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#8a92b0', 0.02), transparent: true, opacity: 0.4, depthWrite: false }))
      cloud.scale.set(16, 5, 1); cloud.position.y = -1.4
      icon.add(cloud)
    } else if (r.id === 'youdu') {
      icon = new THREE.Group()
      const pgeo = new THREE.BoxGeometry(0.5, 3.4, 0.5)
      const matG = new THREE.MeshStandardMaterial({ color: '#0a0f0c', roughness: 1 })
      const q1 = new THREE.Mesh(pgeo, matG); q1.position.set(-1.2, 1.7, 0)
      const q2 = new THREE.Mesh(pgeo, matG); q2.position.set(1.2, 1.7, 0)
      const top = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 0.6), matG); top.position.y = 3.6
      icon.add(q1, q2, top)
      ;[q1, q2, top].forEach((m) => {
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: '#7ee8a0', transparent: true, opacity: 0.9 }))
        e.position.copy(m.position); icon.add(e)
      })
      const fire = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#7ee8a0'), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }))
      fire.scale.setScalar(4); fire.position.y = 1
      icon.add(fire)
      icon.userData.fire = fire
    } else if (r.id === 'didu') {
      /* 延康帝都：层檐宫阙 + 城门 */
      icon = new THREE.Group()
      const matP = () => new THREE.MeshStandardMaterial({ color: '#10151f', roughness: 0.6, metalness: 0.35, emissive: '#3a5a8a', emissiveIntensity: 0.25 })
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.7, 2.6), matP()); base.position.y = 0.35
      const hall = new THREE.Mesh(new THREE.BoxGeometry(3, 1.1, 1.8), matP()); hall.position.y = 1.25
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.1, 4), matP()); roof.position.y = 2.3; roof.rotation.y = Math.PI / 4
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshBasicMaterial({ color: '#8fc3ff' }))
      finial.position.y = 3
      icon.add(base, hall, roof, finial)
      ;[base, hall, roof].forEach((m) => {
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: '#8fc3ff', transparent: true, opacity: 0.85 }))
        e.position.copy(m.position); e.rotation.copy(m.rotation)
        icon.add(e)
      })
      const lg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#8fc3ff'), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }))
      lg.scale.setScalar(6); lg.position.y = 1.6
      icon.add(lg)
    } else if (r.id === 'miluo') {
      icon = new THREE.Group()
      const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#b39dff'), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }))
      core.scale.setScalar(5)
      icon.add(core)
      const dots = []
      for (let i = 0; i < 4; i++) {
        const d = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#e8dcff'), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }))
        d.scale.setScalar(1.6)
        icon.add(d); dots.push(d)
      }
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h, 6),
        new THREE.MeshBasicMaterial({ color: '#b39dff', transparent: true, opacity: 0.35 }))
      beam.position.y = -h / 2 + 1
      icon.add(beam)
      icon.userData.dots = dots
    }
    if (icon) { icon.position.y = h; g.add(icon) }

    g.position.set(x, base, z)
    root.add(g)

    const hit = new THREE.Mesh(new THREE.SphereGeometry(2.6, 8, 8), new THREE.MeshBasicMaterial({ visible: false }))
    hit.position.y = h
    g.add(hit)
    hit.userData.region = r
    pickables.push(hit)

    const el = document.createElement('button')
    el.className = 'rglabel'
    el.style.setProperty('--c', r.color)
    el.textContent = r.name
    el.addEventListener('click', () => { ctx.onOpenRegion(r); focus(r) })
    ctx.layer.appendChild(el)

    const marker = { r, g, icon, el, pos: new THREE.Vector3(x, base + h + 1.4, z) }
    markers.push(marker)
    groups[r.id] = marker
    return marker
  }
  REGIONS.forEach(buildMarker)

  /* 商路虚线 */
  const routes = [['daxu', 'yankang'], ['daxu', 'xitu'], ['daxu', 'wuyou'], ['daxu', 'zuting'], ['yankang', 'tianting'], ['xitu', 'miluo']]
  const dashMats = []
  routes.forEach(([a, b]) => {
    const A = groups[a].g.position, B = groups[b].g.position
    const mid = A.clone().add(B).multiplyScalar(0.5)
    mid.y += 8
    const curve = new THREE.QuadraticBezierCurve3(A.clone().setY(A.y + 1), mid, B.clone().setY(B.y + 1))
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)),
      new THREE.LineDashedMaterial({ color: '#8a7a4a', dashSize: 0.8, gapSize: 0.7, transparent: true, opacity: 0.5 })
    )
    line.computeLineDistances()
    root.add(line)
    dashMats.push(line.material)
  })

  /* 相机轨道 */
  let theta = 0.6, thetaT = 0.6, phi = 0.74, phiT = 0.74, radius = 72, radiusT = 72
  const target = new THREE.Vector3(0, 6, 0)
  function focus(r) {
    const m = groups[r.id]
    target.set(m.g.position.x * 0.7, 6 + m.g.position.y * 0.3, m.g.position.z * 0.7)
    radiusT = 38
  }

  const state = {
    scene, camera, root,
    update(t, dt) {
      theta += (thetaT - theta) * 0.06
      phi += (phiT - phi) * 0.06
      radius += (radiusT - radius) * 0.06
      thetaT += dt * 0.018
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta)
      )
      camera.lookAt(target)
      markers.forEach((m, i) => {
        if (m.icon?.userData?.ring) m.icon.userData.ring.rotation.z = t * 0.5
        if (m.icon?.userData?.fire) m.icon.userData.fire.material.opacity = 0.55 + Math.sin(t * 3 + i) * 0.2
        if (m.icon?.userData?.rune) m.icon.userData.rune.material.opacity = 0.4 + Math.sin(t * 1.8 + i) * 0.18
        if (m.icon?.userData?.wins) m.icon.userData.wins.forEach((wn, j) => {
          wn.material.opacity = 0.75 + Math.sin(t * 2.1 + j * 1.3) * 0.2
        })
        if (m.icon?.userData?.dots) m.icon.userData.dots.forEach((d, j) => {
          const a = t * 0.6 + (j / 4) * Math.PI * 2
          d.position.set(Math.cos(a) * 2.4, Math.sin(a * 1.4) * 1.2, Math.sin(a) * 2.4)
        })
      })
      dashMats.forEach((m, i) => { /* 静态虚线即可 */ })
      const w = innerWidth, h = innerHeight
      markers.forEach((m) => placeLabel(m.el, m.pos, camera, w, h))
    },
    onMove(e, ndc, d, dx, dy) {
      if (d) {
        thetaT -= dx * 0.0026
        phiT = Math.max(0.42, Math.min(1.1, phiT - dy * 0.0018))
      }
    },
    onWheel(e) {
      radiusT = Math.max(24, Math.min(85, radiusT + e.deltaY * 0.03))
    },
    onUp(e, ndc, isClick) {
      if (!isClick) return
      const hit = eng.pick(ndc, pickables)
      if (hit) { ctx.onOpenRegion(hit.object.userData.region); focus(hit.object.userData.region) }
    },
    enter() { radiusT = 72; phiT = 0.74; target.set(0, 6, 0) },
    focusRegion(id) { const r = REGIONS.find((x) => x.id === id); if (r) focus(r) }
  }
  return state
}
