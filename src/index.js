import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import Stats from "stats.js"

var stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

const canvas = document.getElementById("viewport")
var scene = new THREE.Scene()
scene.background = new THREE.Color(0x111111)

var camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
)

camera.position.y = 3
camera.position.x = 10
camera.position.z = -10

var ambientLight = new THREE.AmbientLight(0xffffff, 0.3) // soft white light
scene.add(ambientLight)

var directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(0.5, 1, 0.5)
directionalLight.castShadow = true
directionalLight.shadow.camera.left = -10
directionalLight.shadow.camera.right = 10
directionalLight.shadow.camera.top = -10
directionalLight.shadow.camera.bottom = 10
directionalLight.shadow.camera.near = -10 // default
directionalLight.shadow.camera.far = 10
directionalLight.shadow.mapSize.width = 1024 // default
directionalLight.shadow.mapSize.height = 1024
directionalLight.shadow.bias = -0.01

// const left = 1
// const right = 1
// const top = 1
// const bottom = 1
// const nearClip = 1
// const farClip = 2

// directionalLight.shadow.camera = new THREE.OrthographicCamera(
//   left,
//   right,
//   top,
//   bottom,
//   nearClip,
//   farClip,
// )

scene.add(directionalLight)
// var helper = new THREE.CameraHelper(directionalLight.shadow.camera)
// scene.add(helper)

const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 5, 0)
controls.update()

var renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.gammaOutput = true
renderer.gammaFactor = 2.2
renderer.shadowMapEnabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

var loader = new GLTFLoader()

const file = "models/hitman.glb"
// const file = "models/earther.glb"
// const file = "models/well.glb"
// const file = "models/imperius.glb"
// const file = "models/cutie.glb"

loader.load(file, function(gltf) {
  const model = gltf.scene

  model.traverse(function(child) {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  const box = new THREE.Box3().setFromObject(model)
  const boxSize = box.getSize(new THREE.Vector3()).length()
  const boxCenter = box.getCenter(new THREE.Vector3())

  var pivot = new THREE.Group()
  scene.add(pivot)
  pivot.add(model)

  // set the camera to frame the box
  frameArea(boxSize * 1.2, boxSize, boxCenter, camera)

  controls.maxDistance = boxSize * 10
  controls.target.copy(boxCenter)
  controls.update()

  scene.add(model)

  function animate() {
    stats.begin()

    // model.rotation.y += 0.01

    renderer.render(scene, camera)
    stats.end()
    requestAnimationFrame(animate)
  }

  animate()
})

function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
  const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5
  const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5)
  const distance = halfSizeToFitOnScreen / Math.tan(halfFovY)

  // compute a unit vector that points in the direction the camera is now
  // from the center of the box
  const direction = new THREE.Vector3()
    .subVectors(camera.position, boxCenter)
    .normalize()

  // move the camera to a position distance units way from the center
  // in whatever direction the camera was from the center already
  camera.position.copy(direction.multiplyScalar(distance).add(boxCenter))

  // pick some near and far values for the frustum that
  // will contain the box.
  camera.near = boxSize / 100
  camera.far = boxSize * 100

  camera.updateProjectionMatrix()

  // point the camera to look at the center of the box
  camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z)
}
