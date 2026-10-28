/* ============================================================
 * 编年史 · 时间长河：鎏金大河、五座纪元之门、三十一枚史星
 * 拖拽/滚轮沿河而行，点击史星读事件
 * ============================================================ */
import * as THREE from 'three'
import { makeStars, placeLabel, textTexture, glowTexture, easeInOutCubic, isMobile } from '../engine.js'
import { ERAS, EVENTS } from '../data.js'

export function createTimeline(eng, ctx) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#04060c')
  scene.fog = new THREE.FogExp2('#05070e', 0.011)

  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400)
  const root = new THREE.Group()
  scene.add(root)

  const stars = makeStars(isMobile ? 500 : 900, [240, 130, 160], ['#cfe4ff', '#ffe9c4', '#b3a6ff'])
  stars.position.set(0, 12, -70)
  root.add(stars)

  /* 长河曲线 */
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-58, 0, -26),
    new THREE.Vector3(-40, 0.6, -6),
    new THREE.Vector3(-20, -0.6, 10),
    new THREE.Vector3(0, 0.8, 16),
    new THREE.Vector3(20, -0.4, 8),
    new THREE.Vector3(38, 0.6, -10),
    new THREE.Vector3(56, 0, -30)
  ])

  /* 河体：暗底 + 鎏金流光 */
  const tubeGeo = new THREE.TubeGeometry(curve, 260, 1.35, 12, false)
  const riverMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime;
      void main(){
        vec3 base = vec3(0.05,0.07,0.13);
        float flow = smoothstep(0.75, 1.0, sin((vUv.x*60.0 - uTime*1.6))*0.5+0.5);
        float flow2 = smoothstep(0.86, 1.0, sin((vUv.x*23.0 + uTime*0.7 + 2.0))*0.5+0.5);
        float edge = smoothstep(0.5, 0.12, abs(vUv.y-0.5)*2.0);
        vec3 gold = vec3(1.0, 0.78, 0.36);
        vec3 cyan = vec3(0.42, 0.85, 0.8);
        vec3 col = base + gold*flow*0.85 + cyan*flow2*0.5;
        gl_FragColor = vec4(col, edge*(0.5 + flow*0.5));
      }`
  })
  const river = new THREE.Mesh(tubeGeo, riverMat)
  root.add(river)

  const riverGlow = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 3.4, 10, false),
    new THREE.MeshBasicMaterial({ color: '#243a52', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }))
  root.add(riverGlow)

  /* 纪元之门（牌坊） */
  const gates = []
  ERAS.forEach((era, i) => {
    const t = 0.08 + (i / (ERAS.length - 1)) * 0.72
    const pos = curve.getPointAt(t)
    const tan = curve.getTangentAt(t)
    const g = new THREE.Group()
    const dark = new THREE.MeshBasicMaterial({ color: '#0a0d16' })
    const pillarGeo = new THREE.BoxGeometry(0.55, 7.6, 0.55)
    const p1 = new THREE.Mesh(pillarGeo, dark); p1.position.set(-3.1, 3.8, 0)
    const p2 = new THREE.Mesh(pillarGeo, dark); p2.position.set(3.1, 3.8, 0)
    const beam = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.62, 0.72), dark); beam.position.y = 7.6
    const beam2 = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.42, 0.5), dark); beam2.position.y = 6.3
    g.add(p1, p2, beam, beam2)
    const edges = [p1, p2, beam, beam2].map((m) => {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),
        new THREE.LineBasicMaterial({ color: era.color, transparent: true, opacity: 0.9 }))
      e.position.copy(m.position)
      return e
    })
    edges.forEach((e) => g.add(e))
    const plaque = textTexture(era.name, { size: 64, color: era.color })
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(plaque.aspect * 0.85, 0.85),
      new THREE.MeshBasicMaterial({ map: plaque.tex, transparent: true, fog: false }))
    pm.position.set(0, 6.95, 0.42)
    g.add(pm)
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(era.color), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, fog: false
    }))
    glow.scale.setScalar(7); glow.position.y = 6.9
    g.add(glow)
    g.position.copy(pos).add(new THREE.Vector3(0, -1.6, 0))
    g.lookAt(pos.clone().add(new THREE.Vector3(-tan.z, 0, tan.x)))
    root.add(g)
    gates.push({ era, t, glow, gpos: pos.clone().add(new THREE.Vector3(0, 5, 0)) })
  })

  /* 史星（事件珠） */
  const orbs = []
  const pickables = []
  const all = EVENTS
  all.forEach((ev) => {
    const era = ERAS.find((e) => e.id === ev.era)
    /* 神话事件沿纪元门分布（河北岸）；牧之旅程全部落在延康段·河南岸 */
    const gateT = 0.08 + (ERAS.indexOf(era) / (ERAS.length - 1)) * 0.72
    const mythIdx = orbs.filter((o) => o.ev.track === 'myth' && o.ev.era === ev.era).length
    const pathIdx = orbs.filter((o) => o.ev.track === 'path').length
    const base = ev.track === 'myth'
      ? Math.min(gateT + 0.015 + mythIdx * 0.024, gateT + 0.115)
      : 0.685 + 0.285 * ev.t
    const side = ev.track === 'myth' ? 1 : (pathIdx % 2 ? 1 : -1)
    const pos = curve.getPointAt(Math.min(Math.max(base, 0.01), 0.99))
    const tan = curve.getTangentAt(Math.min(Math.max(base, 0.01), 0.99))
    const n = new THREE.Vector3(-tan.z, 0, tan.x).normalize()
    const lift = 1.4 + ((base * 7.3) % 1) * 1.8 + (ev.track === 'path' ? (pathIdx % 4) * 0.85 : 0)
    const lateral = 2.6 * side + (ev.track === 'path' ? ((pathIdx % 3) - 1) * 1.4 : 0)
    pos.add(n.multiplyScalar(lateral)).add(new THREE.Vector3(0, lift, 0))
    const color = ev.track === 'path' ? '#ffd76b' : era.color
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16),
      new THREE.MeshBasicMaterial({ color, fog: false }))
    orb.position.copy(pos)
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(color), transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, fog: false
    }))
    halo.scale.setScalar(1.9)
    orb.add(halo)
    orb.userData.event = ev
    root.add(orb)
    pickables.push(orb)
    const el = document.createElement('button')
    el.className = 'evlabel' + (ev.track === 'path' ? ' path' : '')
    el.style.setProperty('--c', color)
    el.innerHTML = `<i></i><span>${ev.title}</span>`
    el.addEventListener('click', () => { ctx.onOpenEvent(ev); flyTo(base, pos) })
    ctx.layer.appendChild(el)
    orbs.push({ ev, orb, el, t: base, pos })
  })

  /* 相机：高瞰全河 —— 44 条史载尽收一图 */
  let theta = 0.35, thetaT = 0.35, phi = 0.8, phiT = 0.8, radius = 96, radiusT = 96
  let userMoved = false
  const target = new THREE.Vector3(0, 2, 0)
  const targetT = new THREE.Vector3(0, 2, 0)
  const _right = new THREE.Vector3(), _up = new THREE.Vector3()
  function focusAt(pos, r) { targetT.copy(pos); radiusT = r; userMoved = true }

  const state = {
    scene, camera, root,
    update(t, dt) {
      riverMat.uniforms.uTime.value = t
      stars.userData.shader.uniforms.uTime.value = t
      if (!userMoved) thetaT += dt * 0.012
      theta += (thetaT - theta) * 0.06
      phi += (phiT - phi) * 0.06
      radius += (radiusT - radius) * 0.06
      target.lerp(targetT, 0.06)
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta)
      )
      camera.lookAt(target)
      const w = innerWidth, h = innerHeight
      for (const o of orbs) placeLabel(o.el, o.pos, camera, w, h)
      gates.forEach((g, i) => {
        g.glow.material.opacity = 0.3 + Math.sin(t * 1.4 + i) * 0.08
      })
      riverGlow.material.opacity = 0.13 + Math.sin(t * 0.8) * 0.04
    },
    onMove(e, ndc, dragging, dx, dy) {
      if (dragging) {
        userMoved = true
        /* 地图式平移：沿相机右/上方向移动取景中心 */
        _right.set(1, 0, 0).applyQuaternion(camera.quaternion)
        _up.set(0, 1, 0).applyQuaternion(camera.quaternion)
        const k = (radius / 96) * 0.16
        targetT.addScaledVector(_right, -dx * k).addScaledVector(_up, dy * k)
        targetT.x = Math.max(-78, Math.min(78, targetT.x))
        targetT.y = Math.max(-4, Math.min(46, targetT.y))
        targetT.z = Math.max(-48, Math.min(48, targetT.z))
      }
    },
    onWheel(e) {
      userMoved = true
      radiusT = Math.max(14, Math.min(140, radiusT + e.deltaY * 0.04))
      if (radiusT > 110) { targetT.set(0, 2, 0) }
    },
    onUp(e, ndc, isClick) {
      if (!isClick) return
      const hit = eng.pick(ndc, pickables)
      if (hit) {
        const ev = hit.object.userData.event
        ctx.onOpenEvent(ev)
        focusAt(hit.object.position, 22)
      } else if (radiusT < 60) {
        state.resetView()
      }
    },
    enter() {
      target.set(0, 2, 0); targetT.set(0, 2, 0)
      thetaT = 0.35; phiT = 0.8; radiusT = 96; userMoved = false
    },
    resetView() {
      userMoved = false
      targetT.set(0, 2, 0); phiT = 0.8; radiusT = 96
    },
    jumpEra(eraId) {
      const g = gates.find((x) => x.era.id === eraId)
      if (g) focusAt(g.gpos, 34)
    }
  }
  return state
}
