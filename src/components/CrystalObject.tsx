import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const CrystalObject = () => {
  const mountRef = useRef<HTMLDivElement>(null)
  const clock = useRef(new THREE.Clock())

  useEffect(() => {
    // Scene & camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 7

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, precision: 'highp' })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.5
    if (mountRef.current) mountRef.current.appendChild(renderer.domElement)

    // Gradient environment
    function createGradientTexture() {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')!
      const grad = ctx.createLinearGradient(0, 0, 0, 256)
      grad.addColorStop(0, '#111122')
      grad.addColorStop(1, '#334466')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 256, 256)
      return canvas
    }
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128)
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget)
    scene.add(cubeCamera)
    const envScene = new THREE.Scene()
    const envSphere = new THREE.Mesh(
      new THREE.SphereGeometry(100, 32, 32),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(createGradientTexture()), side: THREE.BackSide })
    )
    envScene.add(envSphere)
    // Delay cubemap generation to idle
    requestIdleCallback(() => {
      cubeCamera.update(renderer, envScene)
    })


    // Small-crystal geometry
    function createSmallCrystalGeometry(scale: number, variation: number) {
      const geo = new THREE.BufferGeometry()
      const s = scale * 0.7
      const rand = () => 1 + (Math.random() - 0.5) * variation
    
      const vertices = [
        0, s * -2 * rand(), 0,
        s * 1.5 * rand(), s * -0.8 * rand(), s * 1.2 * rand(),
        s * -1.2 * rand(), s * -1.0 * rand(), s * 1.4 * rand(),
        s * -1.7 * rand(), s * -0.7 * rand(), s * -0.9 * rand(),
        s * 0.9 * rand(), s * -1.2 * rand(), s * -1.5 * rand(),
        s * 2.2 * rand(), s * 0.5 * rand(), s * 1.8 * rand(),
        s * -1.9 * rand(), s * 0.7 * rand(), s * 2.1 * rand(),
        s * -2.4 * rand(), s * 0.4 * rand(), s * -1.3 * rand(),
        s * 1.4 * rand(), s * 0.2 * rand(), s * -2.1 * rand(),
        0, s * 3.2 * rand(), 0,
      ]
    
      const idx = [
        0, 2, 1,
        0, 3, 2,
        0, 4, 3,
        0, 1, 4,
        1, 2, 6,
        1, 6, 5,
        2, 3, 7,
        2, 7, 6,
        3, 4, 8,
        3, 8, 7,
        4, 1, 5,
        4, 5, 8,
        5, 6, 9,
        6, 7, 9,
        7, 8, 9,
        8, 5, 9
      ]
    
      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
      geo.setIndex(idx)
      geo.computeVertexNormals()
      return geo
    }
    

    // Create crystals
    const crystalGroup = new THREE.Group()
    const smallCrystalsGroup = new THREE.Group()
    scene.add(crystalGroup)
    crystalGroup.add(smallCrystalsGroup)

    function createSmallCrystals(count: number, dir: string) {
      const colors = [0x9ea4f3, 0x9ea4f3, 0x9ea4f3, 0x9ea4f3, 0x9ea4f3]
      const meshes: THREE.Mesh[] = []
      for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshPhysicalMaterial({
          color: colors[i % colors.length],
          metalness: 0.3 + Math.random() * 0.2,
          roughness: Math.random() * 0.1,
          wireframe: true,
          transmission: 0.9 + Math.random() * 0.1,
          thickness: 1,
          reflectivity: 0.5,
          clearcoat: 1,
          clearcoatRoughness: Math.random() * 0.05,
          ior: 2.3 + Math.random() * 0.5,
          opacity: 1,
          envMap: cubeRenderTarget.texture,
          envMapIntensity: 1.2 + Math.random() * 0.6,
          side: THREE.DoubleSide,
        })
        const scaleBase = 0.2 + Math.random() * 0.25
        const geo = createSmallCrystalGeometry(scaleBase, 0.4)
        const mesh = new THREE.Mesh(geo, mat)

        const r = 3 + Math.random() * 1.5
        const theta = Math.random() * Math.PI * 2
        const phi = (Math.random() * 0.8 + 0.1) * Math.PI
        const fx = r * Math.sin(phi) * Math.cos(theta)
        const fy = r * Math.cos(phi) + (Math.random() - 0.5) * 1.5
        const fz = r * Math.sin(phi) * Math.sin(theta)

        let sx = 0, sy = 0, sz = 0
        const d = 25 + Math.random() * 15
        switch (dir) {
          case 'left':   sx = -d; sy = fy + (Math.random() - 0.5) * 10; sz = fz + (Math.random() - 0.5) * 10; break
          case 'right':  sx = d;  sy = fy + (Math.random() - 0.5) * 10; sz = fz + (Math.random() - 0.5) * 10; break
          case 'top':    sx = fx + (Math.random() - 0.5) * 10; sy = d;  sz = fz + (Math.random() - 0.5) * 10; break
          case 'bottom': sx = fx + (Math.random() - 0.5) * 10; sy = -d; sz = fz + (Math.random() - 0.5) * 10; break
          case 'front':  sx = fx + (Math.random() - 0.5) * 10; sy = fy + (Math.random() - 0.5) * 10; sz = d;  break
          case 'back':   sx = fx + (Math.random() - 0.5) * 10; sy = fy + (Math.random() - 0.5) * 10; sz = -d; break
          default:
            const a = Math.random() * Math.PI * 2
            const e = Math.random() * Math.PI
            sx = Math.sin(e) * Math.cos(a) * d
            sy = Math.cos(e) * d
            sz = Math.sin(e) * Math.sin(a) * d
        }

        mesh.position.set(sx, sy, sz)
        mesh.userData = {
          startPosition: new THREE.Vector3(sx, sy, sz),
          finalPosition: new THREE.Vector3(fx, fy, fz),
          originalPosition: new THREE.Vector3(fx, fy, fz),
          rotationSpeed: (Math.random() - 0.5) * 0.01,
          oscillationSpeed: 0.5 + Math.random() * 1.5,
          oscillationAmplitude: 0.05 + Math.random() * 0.2,
          entranceSpeed: 0.5 + Math.random() * 0.3,
          entranceDelay: Math.random() * 1.5,
          entranceProgress: 0,
        }

        smallCrystalsGroup.add(mesh)
        meshes.push(mesh)
      }
      return meshes
    }

    let delayOffset = 0
    createSmallCrystals(5 + Math.floor(Math.random() * 3), 'random')
    delayOffset += 0.25
    createSmallCrystals(6 + Math.floor(Math.random() * 4), 'right').forEach(c => {
      c.userData.finalPosition.x -= 2
      c.userData.originalPosition.x -= 2
      c.userData.entranceDelay += delayOffset
    })
    delayOffset += 0.25
    createSmallCrystals(6 + Math.floor(Math.random() * 4), 'right').forEach(c => {
      c.userData.finalPosition.x += 2
      c.userData.originalPosition.x += 2
      c.userData.entranceDelay += delayOffset
    })
    delayOffset += 0.25
    createSmallCrystals(1 + Math.floor(Math.random() * 4), 'top').forEach(c => c.userData.entranceDelay += delayOffset)
    delayOffset += 0.25
    createSmallCrystals(1 + Math.floor(Math.random() * 4), 'bottom').forEach(c => c.userData.entranceDelay += delayOffset)
    delayOffset += 0.25
    createSmallCrystals(1 + Math.floor(Math.random() * 4), 'front').forEach(c => c.userData.entranceDelay += delayOffset)
    delayOffset += 0.25
    createSmallCrystals(1 + Math.floor(Math.random() * 4), 'back').forEach(c => c.userData.entranceDelay += delayOffset)

    // Lighting
    scene.add(new THREE.AmbientLight(0x404040, 0.8))
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5)
    dirLight.position.set(1, 2, 4)
    scene.add(dirLight)
    const fillLight = new THREE.DirectionalLight(0xcce8ff, 1.8)
    fillLight.position.set(-4, -1, 2)
    scene.add(fillLight)
    const rimLight = new THREE.DirectionalLight(0xffffff, 2.2)
    rimLight.position.set(0, 0, -5)
    scene.add(rimLight)

    const handleResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', handleResize)

    const animate = () => {
      requestAnimationFrame(animate)
      const elapsed = clock.current.getElapsedTime()

      // Gentle rotation of the entire crystal group
      crystalGroup.rotation.y = elapsed * 0.2
      crystalGroup.rotation.z = Math.sin(elapsed * 0.1) * 0.1
      crystalGroup.rotation.x = Math.sin(elapsed * 0.15) * 0.1

      // Animate each crystal individually
      smallCrystalsGroup.children.forEach((c: any) => {
        const u = c.userData
        if (elapsed > u.entranceDelay) {
          const p = Math.min(1, (elapsed - u.entranceDelay) * (u.entranceSpeed * 0.4))
          u.entranceProgress = p
          const ep = 1 - Math.pow(1 - p, 5)
          if (p < 1) {
            c.position.lerpVectors(u.startPosition, u.finalPosition, ep)
          } else {
            const tf = Math.min(1, (p - 1) * 5 + 1)
            c.position.x = u.originalPosition.x + Math.sin(elapsed * u.oscillationSpeed) * u.oscillationAmplitude * tf
            c.position.y = u.originalPosition.y + Math.cos(elapsed * u.oscillationSpeed * 0.8) * u.oscillationAmplitude * tf
            c.position.z = u.originalPosition.z + Math.sin(elapsed * u.oscillationSpeed * 1.2) * u.oscillationAmplitude * tf
          }
        }
        const rm = u.entranceProgress > 0 ? Math.min(1, u.entranceProgress * 3) : 0
        c.rotation.x += u.rotationSpeed * rm
        c.rotation.y += u.rotationSpeed * 1.3 * rm
        c.rotation.z += u.rotationSpeed * 0.7 * rm
      })

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        top: '50vh',
        left: '50vw',
        transform: 'translate(-50%, -50%)',
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  )
}

export default CrystalObject