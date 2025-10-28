"use strict";

let canvas, gl;
let pointsArray = [];
let colorsArray = [];
let normalsArray = [];

let shaderProgram;

// animasi default
let isAnimating = true;
let animationId = null;
let rotationSpeed = 0.2; 
let doorAnimationPhase = 0; // 0: menutup, 1: membuka, 2: menutup lagi
let doorAnimationCounter = 0;

// const gray = vec4(0.8, 0.8, 0.8, 1.0);
// const white = vec4(1.0, 1.0, 1.0, 1.0);
// const cyan  = vec4(0.0, 0.0, 0.0, 1.0);

const vertices = [
  // --- Wall ---
  vec3(-0.72,  0.64, 0.0), // 1
  vec3(-0.48,  0.64, 0.0), // 2
  vec3(-0.72, -0.64, 0.0), // 3
  vec3(-0.48, -0.64, 0.0), // 4

  // Right wall (gap = 0.96)
  vec3( 0.48,  0.64, 0.0), // 5
  vec3( 0.72,  0.64, 0.0), // 6
  vec3( 0.48, -0.64, 0.0), // 7
  vec3( 0.72, -0.64, 0.0), // 8

  // Middle upper wall
  vec3(-0.48, 0.4, 0.0), // 9
  vec3( 0.48, 0.4, 0.0), // 10

  // --- Door frame 11-14 ---
  // Left door frame
  vec3(-0.42, 0.4, 0), // 11
  vec3(-0.42, -0.64, 0), // 12
  
  // Right door frame
  vec3( 0.42, 0.4, 0), // 13
  vec3( 0.42, -0.64, 0), // 14
  
  // Middle upper door frame
  vec3(-0.418, 0.4, 0), // 15
  vec3(-0.418, 0.34, 0), // 16
  vec3( 0.418, 0.4, 0), // 17
  vec3( 0.418, 0.34, 0), // 18

  // Left Door
  vec3(-0.005, 0.34, 0), // 19
  vec3(-0.005, -0.64, 0), // 20
  vec3(-0.42, 0.34, 0), // 21

  // Right Door
  vec3( 0.005, 0.34, 0), // 22
  vec3( 0.005, -0.64, 0), // 23
  vec3( 0.42, 0.34, 0), // 24

  // 3D left wall
  vec3(-0.72,  0.64, 0.24), // 25
  vec3(-0.48,  0.64, 0.24), // 26
  vec3(-0.72, -0.64, 0.24), // 27
  vec3(-0.48, -0.64, 0.24), // 28

  // 3D right wall
  vec3( 0.48,  0.64, 0.24), // 29
  vec3( 0.72,  0.64, 0.24), // 30
  vec3( 0.48, -0.64, 0.24), // 31
  vec3( 0.72, -0.64, 0.24), // 32

  // 3D middle upper wall
  vec3(-0.48, 0.4, 0.24), // 33
  vec3( 0.48, 0.4, 0.24), // 34

  // 3D left door frame
  vec3(-0.48, -0.64, 0.06), // (4) 35
  vec3(-0.48, 0.4, 0.06), // (9) 36
  vec3(-0.42, 0.4, 0.06), // 37
  vec3(-0.42, -0.64, 0.06), // 38

  // 3D right door frame
  vec3( 0.48, -0.64, 0.06), // (7) 39
  vec3( 0.48, 0.4, 0.06), // (10) 40  
  vec3( 0.42, 0.4, 0.06), // 41
  vec3( 0.42, -0.64, 0.06), // 42

  // 3D middle upper door frame
  vec3(-0.418, 0.4, 0.06), // 43
  vec3(-0.418, 0.34, 0.06), // 44
  vec3( 0.418, 0.4, 0.06), // 45
  vec3( 0.418, 0.34, 0.06), // 46

  // 3D Left door
  vec3(-0.42, -0.64, 0.03), // (12) 47
  vec3(-0.005, 0.34, 0.03), // 48
  vec3(-0.005, -0.64, 0.03), // 49
  vec3(-0.42, 0.34, 0.03), // 50

  // 3D Right door
  vec3( 0.42, -0.64, 0.03), // (14) 51
  vec3( 0.005, 0.34, 0.03), // 52
  vec3( 0.005, -0.64, 0.03), // 53
  vec3( 0.42, 0.34, 0.03), // 54
];

const lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
const lightAmbient = vec4(0.5, 0.5, 0.5, 1.0);
const lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
const lightSpecular = vec4(0.6, 0.6, 0.6, 1.0);

const whiteWallAmbient = vec4(1.0, 1.0, 1.0, 1.0);
const whiteWallDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
const whiteWallSpecular = vec4(0.2, 0.2, 0.2, 1.0);

const blueDoorAmbient  = vec4(0.3, 0.7, 0.8, 1.0);
const blueDoorDiffuse  = vec4(0.4, 0.8, 0.9, 1.0);
const blueDoorSpecular = vec4(0.15, 0.15, 0.2, 1.0);

const grayFrameAmbient  = vec4(0.4, 0.4, 0.4, 1.0);
const grayFrameDiffuse  = vec4(0.6, 0.6, 0.6, 1.0);
const grayFrameSpecular = vec4(0.1, 0.1, 0.1, 1.0);

const materialShininess = 50.0;

function quad(a, b, c, d) {
  // compute face normal (counter-clockwise order assumed)
  const t1 = subtract(vertices[b], vertices[a]);
  const t2 = subtract(vertices[c], vertices[a]);
  const normal = normalize(cross(t1, t2));

  pointsArray.push(vertices[a], vertices[b], vertices[c]);
  pointsArray.push(vertices[a], vertices[c], vertices[d]);

  for (let i = 0; i < 6; i++) {
    // colorsArray.push(color);
    normalsArray.push(normal);
  }
}

// hierarchical variables
let modelViewMatrix, modelViewMatrixLoc;
let stack = [];
let wallNode, frameNode, leftDoorNode, rightDoorNode;
let theta = 0;
let leftDoorAngle = 0;
let rightDoorAngle = 0;
let wallStart, frameStart, leftDoorStart, rightDoorStart;
let wallCount, frameCount, leftDoorCount, rightDoorCount;

// Translation variables
let translateX = 0;
let translateY = 0;
let translateZ = 0;

let uLightPositionLoc, uLightAmbientLoc, uLightDiffuseLoc, uLightSpecularLoc, uShininessLoc;
let uMaterialAmbientLoc, uMaterialDiffuseLoc, uMaterialSpecularLoc;

function buildWallAndDoor() {
  const startWall = pointsArray.length;

  // Left wall (white)
    quad(2, 3, 1, 0);  // left wall
  quad(26, 2, 0, 24);
  quad(3, 27, 25, 1);
  quad(27, 26, 24, 25);

  quad(6, 7, 5, 4);  // right wall
  quad(7, 31, 29, 5);
  quad(30, 6, 4, 28);
  quad(31, 30, 28, 29);

  quad(8, 9, 4, 1);  // middle upper wall
  quad(25, 1, 4, 28);
  quad(8, 32, 33, 9);
  quad(33, 32, 25, 28);

  wallStart = startWall;
  wallCount = pointsArray.length - startWall;

  const startFrame = pointsArray.length;
  
  quad(3, 11, 10, 8); // left door frame
  quad(11, 37, 36, 10);
  quad(37, 34, 35, 36);

  quad(13, 6, 9, 12); // right door frame
  quad(41, 13, 12, 40);
  quad(38, 41, 40, 39);

  quad(15, 17, 16, 14); // middle upper door frame
  quad(43, 45, 17, 15);
  quad(45, 43, 42, 44);

  frameStart = startFrame;
  frameCount = pointsArray.length - startFrame;

  const startLeftDoor = pointsArray.length;
  
  // Left door front (cyan)
  quad(11, 19, 18, 20); // left door
  quad(19, 48, 47, 18);
  quad(46, 11, 20, 49);
  quad(48, 46, 49, 47);

  leftDoorStart = startLeftDoor;
  leftDoorCount = pointsArray.length - startLeftDoor;

  const startRightDoor = pointsArray.length;
  
  quad(22, 13, 23, 21); // right door
  quad(52, 22, 21, 51);
  quad(13, 50, 53, 23);
  quad(50, 52, 51, 53);

  rightDoorStart = startRightDoor;
  rightDoorCount = pointsArray.length - startRightDoor;
}

function createNode(transform, render, sibling, child){
  return { transform, render, sibling, child };
}

function initNodes(){
  const wallTransform = mult(
      translate(translateX, translateY, translateZ),
      rotateY(theta)
  );
  
  const frameTransform = mult(
    translate(0, 0, 0.03),
    mat4()
  );

  // Left door rotation (local transformation)
const leftDoorTransform = mult(
  translate(0.08 * (leftDoorAngle / 90), 0, -0.06 * (leftDoorAngle / 90)),
  mult(
    translate(-0.42, 0, 0.11),
    mult(
      rotateY(leftDoorAngle),
      translate(0.42, 0, -0.08)
    )
  )
);
  
  // Right door rotation (local transformation)  
const rightDoorTransform = mult(
  translate(0.08 * (rightDoorAngle / 90), 0, 0.06 * (rightDoorAngle / 90)),
  mult(
    translate(0.42, 0, 0.11),
    mult(
      rotateY(rightDoorAngle),
      translate(-0.42, 0, -0.08)
    )
  )
);


  wallNode  = createNode(wallTransform, renderWall, null, null);
  frameNode = createNode(frameTransform, renderFrame, null, null);
  leftDoorNode = createNode(leftDoorTransform, renderLeftDoor, null, null);
  rightDoorNode = createNode(rightDoorTransform, renderRightDoor, null, null);

  wallNode.child = frameNode;
  frameNode.child = leftDoorNode;
  leftDoorNode.sibling = rightDoorNode;
}

function traverse(node){
  if(node == null) return;
  stack.push(modelViewMatrix);
  modelViewMatrix = mult(modelViewMatrix, node.transform);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  node.render();
  if(node.child) traverse(node.child);
  modelViewMatrix = stack.pop();
  if(node.sibling) traverse(node.sibling);
}

function animate() {
    if (!isAnimating) return;
    
    // Rotasi tembok
    theta += rotationSpeed;
    if (theta >= 360) theta -= 360;
    
    // Animasi pintu buka tutup
    doorAnimationCounter++;
    if (doorAnimationCounter >= 60) { // Ganti fase setiap 60 frame
        doorAnimationCounter = 0;
        doorAnimationPhase = (doorAnimationPhase + 1) % 3;
    }
    
    // Kontrol buka/tutup pintu berdasarkan fase
    if (doorAnimationPhase === 1) {
        // Fase membuka
        if (leftDoorAngle < 90) leftDoorAngle += 2;
        if (rightDoorAngle > -90) rightDoorAngle -= 2;
    } else if (doorAnimationPhase === 2) {
        // Fase menutup
        if (leftDoorAngle > 0) leftDoorAngle -= 2;
        if (rightDoorAngle < 0) rightDoorAngle += 2;
    }
    
    render();
    animationId = requestAnimationFrame(animate);
}

//mulai/stop animasi
function toggleAnimation() {
    isAnimating = !isAnimating;
    
    if (isAnimating) {
        animate();
        document.getElementById('toggleAnimation').textContent = 'Stop Animation';
        document.getElementById('toggleAnimation').style.backgroundColor = '#e74c3c';
    } else {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        document.getElementById('toggleAnimation').textContent = 'Start Animation';
        document.getElementById('toggleAnimation').style.backgroundColor = '#2ecc71';
    }
}

// Fungsi untuk mereset animasi ke state awal
function resetAnimation() {
    isAnimating = true;
    theta = 0;
    leftDoorAngle = 0;
    rightDoorAngle = 0;
    doorAnimationPhase = 0;
    doorAnimationCounter = 0;
    
    if (!animationId) {
        animate();
    }
    
    document.getElementById('toggleAnimation').textContent = 'Stop Animation';
    document.getElementById('toggleAnimation').style.backgroundColor = '#e74c3c';
}
function setMaterial(ambient, diffuse, specular) {
  gl.uniform4fv(uMaterialAmbientLoc, flatten(ambient));
  gl.uniform4fv(uMaterialDiffuseLoc, flatten(diffuse));
  gl.uniform4fv(uMaterialSpecularLoc, flatten(specular));
}

function renderWall(){ 
  setMaterial(whiteWallAmbient, whiteWallDiffuse, whiteWallSpecular);
  gl.drawArrays(gl.TRIANGLES, wallStart, wallCount);
}
function renderFrame(){ 
  setMaterial(grayFrameAmbient, grayFrameDiffuse, grayFrameSpecular);
  gl.drawArrays(gl.TRIANGLES, frameStart, frameCount);
}
function renderLeftDoor(){ 
  setMaterial(blueDoorAmbient, blueDoorDiffuse, blueDoorSpecular);
  gl.drawArrays(gl.TRIANGLES, leftDoorStart, leftDoorCount);
}
function renderRightDoor(){ 
  setMaterial(blueDoorAmbient, blueDoorDiffuse, blueDoorSpecular);
  gl.drawArrays(gl.TRIANGLES, rightDoorStart, rightDoorCount);
}

window.onload = function init(){
  canvas = document.getElementById("gl-canvas");
  gl = canvas.getContext("webgl2");
  if(!gl) { alert("WebGL 2.0 isn't available"); return; }

  pointsArray.length = 0;
  colorsArray.length = 0;
  normalsArray.length = 0;

  buildWallAndDoor();

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearDepth(1.0);

  // gl.enable(gl.CULL_FACE);
  // gl.frontFace(gl.CCW);
  // gl.cullFace(gl.BACK);

  const program = initShaders(gl, "vertex-shader", "fragment-shader");
  shaderProgram = program;
  gl.useProgram(program);

  // position buffer
  const vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
  const vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // color buffer
    // const cBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);
    // const vColor = gl.getAttribLocation(program, "vColor");
    // gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(vColor);

  // normal buffer
  const nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
  const vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  // cache uniform locations
  uLightPositionLoc = gl.getUniformLocation(program, "lightPosition");
  uLightAmbientLoc = gl.getUniformLocation(program, "lightAmbient");
  uLightDiffuseLoc = gl.getUniformLocation(program, "lightDiffuse");
  uLightSpecularLoc = gl.getUniformLocation(program, "lightSpecular");
  uShininessLoc = gl.getUniformLocation(program, "shininess");

  uMaterialAmbientLoc = gl.getUniformLocation(program, "materialAmbient");
  uMaterialDiffuseLoc = gl.getUniformLocation(program, "materialDiffuse");
  uMaterialSpecularLoc = gl.getUniformLocation(program, "materialSpecular");

  // set light uniforms
  gl.uniform4fv(uLightPositionLoc, flatten(lightPosition));
  gl.uniform4fv(uLightAmbientLoc, flatten(lightAmbient));
  gl.uniform4fv(uLightDiffuseLoc, flatten(lightDiffuse));
  gl.uniform4fv(uLightSpecularLoc, flatten(lightSpecular));
  gl.uniform1f(uShininessLoc, materialShininess);

      setTimeout(() => {
        animate();
    }, 1000);

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  
  render();
};

function render(){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  initNodes();
  modelViewMatrix = mat4();
  // Camera setup
  // const eye = vec3(0.0, 0.0, 2.0);       // camera position
  // const at  = vec3(0.0, 0.0, 0.0);       // look-at target
  // const up  = vec3(0.0, 1.0, 0.0);       // up direction

  // const viewMatrix = lookAt(eye, at, up);
  // const projectionMatrix = perspective(45, canvas.width / canvas.height, 0.1, 10.0);

  // // Model transform base (used in hierarchical traversal)
  // modelViewMatrix = mult(viewMatrix, mat4());

  // gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "projectionMatrix"), false, flatten(projectionMatrix));
  // gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

  traverse(wallNode);
      if (isAnimating && !animationId) {
        animationId = requestAnimationFrame(animate);
    }
}

// Rotation controls
function rotateLeft(){ theta -= 10; render(); }
function rotateRight(){ theta += 10; render(); }
function resetRotation(){ theta = 0; render(); }

// Translation controls
function moveLeft(){ translateX -= 0.1; render(); }
function moveRight(){ translateX += 0.1; render(); }
function moveUp(){ translateY += 0.1; render(); }
function moveDown(){ translateY -= 0.1; render(); }
function resetPosition(){ 
  translateX = 0; 
  translateY = 0; 
  translateZ = 0; 
  render(); 
}

// Door animation controls - pintu membuka ke luar
function openLeftDoor(){ 
  leftDoorAngle = 90;
  render(); 
}

function closeLeftDoor(){ 
  leftDoorAngle = 0; 
  render(); 
}

function openRightDoor(){ 
  rightDoorAngle = -90;
  render(); 
}

function closeRightDoor(){ 
  rightDoorAngle = 0; 
  render(); 
}

function resetDoors(){ 
  leftDoorAngle = 0; 
  rightDoorAngle = 0; 
  render(); 
}

// Reset everything
function resetAll(){
  theta = 0;
  leftDoorAngle = 0;
  rightDoorAngle = 0;
  translateX = 0;
  translateY = 0;
  translateZ = 0;
  render();
}