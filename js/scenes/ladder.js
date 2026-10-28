/* ============================================================
 * 修行路 · 登天之梯：七大神藏 → 破桥成神 → 天宫七境 → 第八重
 * 螺旋登天，梯顶天门之后立着巨神之影
 * ============================================================ */
import * as THREE from 'three'
import { glowTexture, silhouetteTexture, textTexture, placeLabel, easeInOutCubic, isMobile } from '../engine.js'
import { REALMS } from '../data.js'

export function createLadder(eng, ctx) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#030409')
  scene.fog = new THREE.FogExp2('#04050c', 0.0085)

  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400)
  const root = new THREE.Group()
  scene.add(root)

  const N = REALMS.length
  const R = 7.5
  const STEP_H = 2.5
  const stepPos = (i) => {
    const a = i * 0.62
    return new THREE.Vector3(Math.cos(a) * R, i * STEP_H, Math.sin(a) * R)
  }

  /* 中央螺旋光带 */
  const helix = new THREE.CatmullRomCurve3(
    Array.from({ length: 80 }, (_, i) => {
      const k = i / 79
      const a = k * N * 0.62
      return new THREE.Vector3(Math.cos(a) * R * 0.55, k * N * STEP_H, Math.sin(a) * R * 0.55)
    })
  )
  const helixMesh = new THREE.Mesh(
    new THREE.TubeGeometry(helix, 200, 0.07, 6, false),
    new THREE.MeshBasicMaterial({ color: '#caa24a', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })
  )
  root.add(helixMesh)

  /* 天梯踏阶 */
  const steps = []
  const pickables = []
  REALMS.forEach((realm, i) => {
    const pos = stepPos(i)
    const g = new THREE.Group()
    const slab = new THREE.Mesh(
      new THREE.CylinderGeometry(2.7, 3.1, 0.5, 26),
      new THREE.MeshStandardMaterial({ color: '#12161f', roughness: 0.8, metalness: 0.3, emissive: '#232c42', emissiveIntensity: 0.55 })
    )
    g.add(slab)
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.55, 0.075, 10, 60),
      new THREE.MeshBasicMaterial({ color: realm.color, transparent: true, opacity: 0.95 })
    )
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.28
    g.add(ring)
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(realm.color), transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false
    }))
    glow.scale.setScalar(6)
    glow.position.y = 0.4
    g.add(glow)
    g.position.copy(pos)
    root.add(g)

    const hit = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 2.4, 10), new THREE.MeshBasicMaterial({ visible: false }))
    hit.position.y = 0.4
    g.add(hit)
    hit.userData.realm = realm
    pickables.push(hit)

    const el = document.createElement('button')
    el.className = 'rlmstep'
    el.style.setProperty('--c', realm.color)
    el.innerHTML = `<b>${realm.name}</b>`
    el.addEventListener('click', () => { ctx.onOpenRealm(realm); goTo(i) })
    ctx.layer.appendChild(el)

    steps.push({ realm, g, ring, glow, el, pos, i })
  })

  /* 踏阶第一层：凡人剪影 */
  const man = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 4.2),
    new THREE.MeshBasicMaterial({ map: silhouetteTexture('man'), transparent: true, fog: false })
  )
  const p0 = stepPos(0)
  man.position.set(p0.x + 3.4, p0.y + 2.1, p0.z)
  root.add(man)

  /* 梯顶：天门 + 巨神之影 */
  const topY = N * STEP_H
  const gate = new THREE.Group()
  {
    const pilGeo = new THREE.BoxGeometry(1.3, 26, 1.3)
    const matG = new THREE.MeshStandardMaterial({ color: '#181206', roughness: 0.4, metalness: 0.6, emissive: '#f0d68a', emissiveIntensity: 0.35 })
    const q1 = new THREE.Mesh(pilGeo, matG); q1.position.set(-9, 13, 0)
    const q2 = new THREE.Mesh(pilGeo, matG); q2.position.set(9, 13, 0)
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(22, 2.4, 2), matG); lintel.position.y = 26.5
    const lintel2 = new THREE.Mesh(new THREE.BoxGeometry(18.5, 1.4, 1.5), matG); lintel2.position.y = 29.2
    gate.add(q1, q2, lintel, lintel2)
    ;[q1, q2, lintel, lintel2].forEach((m) => {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),
        new THREE.LineBasicMaterial({ color: '#ffe9b0', transparent: true, opacity: 0.95 }))
      e.position.copy(m.position)
      gate.add(e)
    })
    const back = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture('#fff3d0', 0.0), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    }))
    back.scale.set(46, 60, 1); back.position.set(0, 17, -6)
    gate.add(back)
    const god = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 60),
      new THREE.MeshBasicMaterial({ map: silhouetteTexture('god'), transparent: true, fog: false })
    )
    god.position.set(0, 20, -5.2)
    gate.add(god)
    const plaque = textTexture('天 門', { size: 72, color: '#ffe9b0' })
    const gateLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(plaque.aspect * 1.6, 1.6),
      new THREE.MeshBasicMaterial({ map: plaque.tex, transparent: true, fog: false, opacity: 0.95 })
    )
    gateLabel.position.set(0, 24.2, 1.2)
    gate.add(gateLabel)
    gate.userData.label = gateLabel
  }
  const topPos = stepPos(N - 1).clone().add(new THREE.Vector3(0, 16, 0))
  gate.position.set(0, topY + 2, 0)
  root.add(gate)

  /* 云海（梯顶之下） */
  const clouds = []
  for (let i = 0; i < (isMobile ? 8 : 14); i++) {
    const c = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture('#2a3350', 0.02), transparent: true, opacity: 0.07, depthWrite: false
    }))
    c.scale.set(18 + Math.random() * 14, 4 + Math.random() * 3, 1)
    c.position.set((Math.random() - 0.5) * 70, 12 + Math.random() * (topY - 14), (Math.random() - 0.5) * 70)
    root.add(c)
    clouds.push(c)
  }

  /* 相机 */
  let idxT = 0
  const camAim = new THREE.Vector3()
  function goTo(i) {
    idxT = i
    const p = stepPos(i)
    const a = i * 0.62 + 1.35
    const from = p.clone().add(new THREE.Vector3(Math.cos(a) * 19, 4.6, Math.sin(a) * 19))
    camAim.copy(p).add(new THREE.Vector3(0, 2.4, 0))
    eng.tween(() => camera.position.x, from.x, 1.5, easeInOutCubic)
    eng.tween(() => camera.position.y, from.y, 1.5, easeInOutCubic)
    eng.tween(() => camera.position.z, from.z, 1.5, easeInOutCubic)
    eng.tween(() => look.x, camAim.x, 1.5, easeInOutCubic)
    eng.tween(() => look.y, camAim.y, 1.5, easeInOutCubic)
    eng.tween(() => look.z, camAim.z, 1.5, easeInOutCubic)
  }
  const look = new THREE.Vector3(0, 4, 0)
  camera.position.set(stepPos(0).x + 10, 4.5, stepPos(0).z + 11)

  let dragAuto = true
  let azim = 0, azimT = 0
  const state = {
    scene, camera, root,
    update(t, dt) {
      /* 空闲缓慢攀升浏览 */
      if (dragAuto && !eng.tweens.length) {
        idxT = (idxT + dt * 0.05) % (N - 0.001)
      }
      azim += (azimT - azim) * 0.08
      if (!eng.tweens.length) {
        const p = stepPos(idxT)
        const a = idxT * 0.62 + 1.35 + azim + t * 0.02 * (dragAuto ? 1 : 0)
        camera.position.lerp(p.clone().add(new THREE.Vector3(Math.cos(a) * 19, 4.6, Math.sin(a) * 19)), 0.02)
        look.lerp(p.clone().add(new THREE.Vector3(0, 2.4, 0)), 0.02)
      }
      camera.lookAt(look)
      steps.forEach((s, i) => {
        const near = Math.abs(i - idxT) < 1.2
        s.glow.material.opacity = near ? 0.6 : 0.26 + Math.sin(t * 1.3 + i * 0.8) * 0.08
        s.ring.scale.setScalar(near ? 1.06 + Math.sin(t * 2.4) * 0.03 : 1)
      })
      const w = innerWidth, h = innerHeight
      steps.forEach((s) => placeLabel(s.el, s.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), camera, w, h, true))
    },
    onMove(e, ndc, d, dx, dy) {
      if (d && !eng.tweens.length) {
        dragAuto = false
        idxT = Math.max(0, Math.min(N - 1, idxT - dy * 0.016))
        azimT += dx * 0.0045
      }
    },
    onWheel(e) {
      dragAuto = false
      idxT = Math.max(0, Math.min(N - 1, idxT + Math.sign(e.deltaY) * 0.5))
      clearTimeout(state._wt)
      state._wt = setTimeout(() => { goTo(Math.round(idxT)); ctx.onOpenRealm(REALMS[Math.round(idxT)]) }, 350)
    },
    onUp(e, ndc, isClick) {
      if (!isClick) return
      const hit = eng.pick(ndc, pickables)
      if (hit) {
        const r = hit.object.userData.realm
        ctx.onOpenRealm(r)
        goTo(REALMS.indexOf(r))
      }
    },
    enter() { dragAuto = true; azimT = 0; goTo(0) },
    jumpRealm(id) {
      const i = REALMS.findIndex((r) => r.id === id)
      if (i >= 0) { dragAuto = false; goTo(i) }
    }
  }
  return state
}
