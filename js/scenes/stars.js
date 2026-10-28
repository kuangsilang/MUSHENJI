/* ============================================================
 * 人物谱 · 星图天官：残老村九老拱卫牧星，群星列宿
 * ============================================================ */
import * as THREE from 'three'
import { makeStars, placeLabel, glowTexture, easeInOutCubic } from '../engine.js'
import { CHARACTERS, CHARACTER_GROUPS, SIL } from '../data.js'
import { svgPortrait } from '../art.js'

export function createStars(eng, ctx) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#04050b')
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500)
  camera.position.set(0, 6, 34)

  const root = new THREE.Group()
  scene.add(root)
  const _wp = new THREE.Vector3()

  const bg = makeStars(1400, [300, 170, 200], ['#cfe4ff', '#ffe9c4', '#b3a6ff', '#ffffff'])
  bg.position.z = -60
  root.add(bg)

  /* 星云底色 */
  const nebColors = ['#2a1f4d', '#12303a', '#3a2a14']
  nebColors.forEach((c, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(c, 0.02), transparent: true, opacity: 0.30, blending: THREE.AdditiveBlending, depthWrite: false
    }))
    s.scale.setScalar(120 + i * 40)
    s.position.set(-60 + i * 70, -10 + i * 18, -80)
    root.add(s)
  })

  /* 群簇布局 */
  const centerGroups = CHARACTER_GROUPS.filter((g) => g !== '主角')
  const clusterPos = {}
  centerGroups.forEach((g, i) => {
    const a = (i / centerGroups.length) * Math.PI * 2 - Math.PI / 2
    const r = 16
    clusterPos[g] = new THREE.Vector3(Math.cos(a) * r * 1.35, 3.5 + Math.abs(Math.sin(a)) * r * 0.72, Math.sin(a * 1.3) * 6)
  })

  const nodes = []
  const pickables = []
  const constellationPts = []

  CHARACTERS.forEach((ch) => {
    const isHero = ch.group === '主角'
    let pos
    if (isHero) pos = new THREE.Vector3(0, 0, 0)
    else {
      const c = clusterPos[ch.group] || new THREE.Vector3()
      const idx = nodes.filter((n) => n.ch.group === ch.group).length
      const memberCount = CHARACTERS.filter((x) => x.group === ch.group && x.id !== 'qinmu').length
      const spread = memberCount >= 8 ? 6.4 : memberCount >= 3 ? 4.4 : 3.6
      const a = (idx / Math.max(memberCount, 1)) * Math.PI * 2 + c.x * 0.13
      pos = c.clone().add(new THREE.Vector3(Math.cos(a) * spread, Math.sin(a * 1.7) * (spread * 0.55), Math.sin(a) * 3))
    }
    const star = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(ch.color, isHero ? 0.02 : 0.05),
      transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false
    }))
    star.scale.setScalar(isHero ? 7 : 2.6)
    star.position.copy(pos)
    star.userData.char = ch
    root.add(star)
    pickables.push(star)
    if (!isHero) constellationPts.push(pos.clone())
    const el = document.createElement('button')
    el.className = 'chlabel' + (isHero ? ' hero' : '')
    el.style.setProperty('--c', ch.color)
    el.textContent = ch.name
    el.addEventListener('click', () => { ctx.onOpenCharacter(ch); flyTo(pos) })
    el.addEventListener('mouseenter', () => { hlId = ch.id })
    el.addEventListener('mouseleave', () => { if (hlId === ch.id) hlId = null })
    ctx.layer.appendChild(el)
    nodes.push({ ch, star, el, pos, isHero })
  })

  /* 残老村连星 */
  const villageNodes = nodes.filter((n) => n.ch.group === '残老村')
  const linePos = []
  for (let i = 0; i < villageNodes.length; i++) {
    const a = villageNodes[i].pos, b = villageNodes[(i + 1) % villageNodes.length].pos
    linePos.push(a, b)
  }
  linePos.push(villageNodes[0].pos.clone().lerp(new THREE.Vector3(0, 0, 0), 0), new THREE.Vector3(0, 0, 0))
  const lines = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(linePos),
    new THREE.LineBasicMaterial({ color: '#f5cf6b', transparent: true, opacity: 0.22 })
  )
  root.add(lines)

  /* 人物关系线（颜色=关系类别，与抽屉"关系"栏呼应） */
  const byId = {}
  nodes.forEach((n) => { byId[n.ch.id] = n })
  const RELS = [
    ['qinmu', 'sugamu', '#f5cf6b'], ['qinmu', 'sipop', '#f5cf6b'], ['qinmu', 'hulingr', '#ffb0d0'],
    ['qinmu', 'longqilin', '#9be07a'], ['qinmu', 'yankangguoshi', '#62a8ff'], ['qinmu', 'yanfengdi', '#62a8ff'],
    ['qinmu', 'litianxing', '#c0453f'], ['qinmu', 'zushi', '#d05a5a'], ['qinmu', 'kaihuang', '#b39dff'],
    ['sugamu', 'qiaoxingjun', '#ff7a5c'], ['sipop', 'litianxing', '#e88ab8'], ['kaihuang', 'yuntianzun', '#a0d0ff'],
    ['miluo', 'taizi', '#c9b8ff'], ['tubo', 'houtu', '#7ee8a0'],
    ['rendao', 'sugamu', '#f0c96b'], ['rendao', 'qinmu', '#f0c96b'],
    ['shanghuang8', 'longxi', '#5fd4b0'], ['shanghuang8', 'dimu', '#8fd4a0']
  ]
  const adj = {}
  RELS.forEach(([a, b]) => { (adj[a] = adj[a] || new Set()).add(b); (adj[b] = adj[b] || new Set()).add(a) })
  const relLines = []
  RELS.forEach(([a, b, col]) => {
    const na = byId[a], nb = byId[b]
    if (!na || !nb) return
    const ln = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([na.pos.clone(), nb.pos.clone()]),
      new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.3 })
    )
    root.add(ln)
    relLines.push({ ln, a, b })
  })

  let dragging = false
  let hlId = null
  let rotY = 0, rotYT = 0, rotX = 0, rotXT = 0
  function flyTo(pos) {
    /* 轻推相机视角朝向目标 */
    const dir = pos.clone().normalize()
    rotYT = Math.atan2(dir.x * 1.35, Math.cos(Math.asin(Math.max(-1, Math.min(1, dir.y)))) || 1) * 0.35
    rotXT = -dir.y * 0.4
  }

  const state = {
    scene, camera, root,
    update(t, dt) {
      bg.userData.shader.uniforms.uTime.value = t
      rotY += (rotYT - rotY) * 0.06
      rotX += (rotXT - rotX) * 0.06
      root.rotation.y = 0.06 * Math.sin(t * 0.1) + rotY
      root.rotation.x = rotX
      nodes.forEach((n, i) => {
        n.star.position.y = n.pos.y + Math.sin(t * 0.9 + i) * 0.18
        if (n.isHero) n.star.scale.setScalar(7 + Math.sin(t * 1.6) * 0.7)
        n.star.material.opacity = n.dim ? 0.18 : 0.95
      })
      const w = innerWidth, h = innerHeight
      const wp = _wp
      nodes.forEach((n) => {
        n.star.getWorldPosition(wp)
        placeLabel(n.el, wp, camera, w, h)
        if (hlId) n.el.style.opacity = (n.isHero || n.ch.id === hlId || adj[hlId]?.has(n.ch.id)) ? '1' : '0.25'
        else if (!n.dim) n.el.style.opacity = ''
      })
      lines.material.opacity = 0.16 + Math.sin(t * 0.8) * 0.06
      relLines.forEach((L, i) => {
        const base = 0.2 + Math.sin(t * 1.1 + i * 0.7) * 0.1
        L.ln.material.opacity = !hlId ? base : (L.a === hlId || L.b === hlId ? 0.85 : 0.04)
      })
    },
    onMove(e, ndc, d, dx, dy) {
      if (d) {
        rotYT += dx * 0.0022
        rotXT = Math.max(-0.6, Math.min(0.6, rotXT + dy * 0.0018))
      }
    },
    onUp(e, ndc, isClick) {
      if (!isClick) return
      const hit = eng.pick(ndc, pickables)
      if (hit) { ctx.onOpenCharacter(hit.object.userData.char); flyTo(hit.object.position) }
    },
    enter() { },
    highlightGroup(group) {
      nodes.forEach((n) => { n.dim = group !== '全部' && n.ch.group !== group })
      return nodes
    }
  }
  return state
}
