"use strict";

let canvas, gl;
let pointsArray = [];
let colorsArray = [];

const red =  vec4(1.0, 0.0, 0.0, 1.0);
const gray = vec4(0.8, 0.8, 0.8, 1.0);
const white = vec4(1.0, 1.0, 1.0, 1.0);
const cyan  = vec4(0.0, 1.0, 1.0, 1.0);
const brown = vec4(0.65, 0.5, 0.4, 1.0);

const vertices = [
  // --- Wall ---
  // Left wall
  vec3(-0.72,  0.64, 0.0), // 0
  vec3(-0.48,  0.64, 0.0), // 1
  vec3(-0.72, -0.64, 0.0), // 2
  vec3(-0.48, -0.64, 0.0), // 3

  // Right wall
  vec3( 0.48,  0.64, 0.0), // 4
  vec3( 0.72,  0.64, 0.0), // 5
  vec3( 0.48, -0.64, 0.0), // 6
  vec3( 0.72, -0.64, 0.0), // 7

  // Middle upper wall
  vec3(-0.48, 0.4, 0.0), // 8
  vec3( 0.48, 0.4, 0.0), // 9

  // --- Door frame ---
  // Left door frame
  vec3(-0.42, 0.4, 0), // 10
  vec3(-0.42, -0.64, 0), // 11
  
  // Right door frame
  vec3( 0.42, 0.4, 0), // 12
  vec3( 0.42, -0.64, 0), // 13
  
  // Middle upper door frame
  vec3(-0.418, 0.4, 0), // 14
  vec3(-0.418, 0.34, 0), // 15
  vec3( 0.418, 0.4, 0), // 16
  vec3( 0.418, 0.34, 0), // 17

  // Left Door
  vec3(-0.42, 0.34, 0), // 18
  vec3(-0.005, 0.34, 0), // 19
  vec3(-0.42, -0.64, 0), // 20
  vec3(-0.005, -0.64, 0), // 21

  // Right Door
  vec3( 0.42, 0.34, 0), // 22
  vec3( 0.005, 0.34, 0), // 23
  vec3( 0.42, -0.64, 0), // 24
  vec3( 0.005, -0.64, 0), // 25

  // 3D left wall - moved further back to avoid z-fighting
  vec3(-0.72,  0.64, 0.25), // 26
  vec3(-0.48,  0.64, 0.25), // 27
  vec3(-0.72, -0.64, 0.25), // 28
  vec3(-0.48, -0.64, 0.25), // 29

  // 3D right wall - moved further back
  vec3( 0.48,  0.64, 0.25), // 30
  vec3( 0.72,  0.64, 0.25), // 31
  vec3( 0.48, -0.64, 0.25), // 32
  vec3( 0.72, -0.64, 0.25), // 33

  // 3D middle upper wall - moved further back
  vec3(-0.48, 0.4, 0.25), // 34
  vec3( 0.48, 0.4, 0.25), // 35

  // 3D left door frame - increased gap
  vec3(-0.48, -0.64, 0.08), // 36
  vec3(-0.48, 0.4, 0.08), // 37
  vec3(-0.42, 0.4, 0.08), // 38
  vec3(-0.42, -0.64, 0.08), // 39

  // 3D right door frame - increased gap
  vec3( 0.48, -0.64, 0.08), // 40
  vec3( 0.48, 0.4, 0.08), // 41  
  vec3( 0.42, 0.4, 0.08), // 42
  vec3( 0.42, -0.64, 0.08), // 43

  // 3D middle upper door frame - increased gap
  vec3(-0.418, 0.4, 0.08), // 44
  vec3(-0.418, 0.34, 0.08), // 45
  vec3( 0.418, 0.4, 0.08), // 46
  vec3( 0.418, 0.34, 0.08), // 47

  // 3D Left door - increased thickness
  vec3(-0.42, 0.34, 0.05), // 48
  vec3(-0.005, 0.34, 0.05), // 49
  vec3(-0.42, -0.64, 0.05), // 50
  vec3(-0.005, -0.64, 0.05), // 51

  // 3D Right door - increased thickness
  vec3( 0.42, 0.34, 0.05), // 52
  vec3( 0.005, 0.34, 0.05), // 53
  vec3( 0.42, -0.64, 0.05), // 54
  vec3( 0.005, -0.64, 0.05), // 55
];

function quad(a, b, c, d, color) {
  pointsArray.push(vertices[a], vertices[b], vertices[c]);
  pointsArray.push(vertices[a], vertices[c], vertices[d]);
  for (let i = 0; i < 6; i++) colorsArray.push(color);
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

// NEW: Translation variables
let translateX = 0;
let translateY = 0;
let translateZ = 0;

function buildWallAndDoor() {
  // compute starts and counts dynamically
  const startWall = pointsArray.length;

  // Left wall (white)
  quad(0, 1, 3, 2, white);  // front
  quad(26, 0, 2, 28, white); // left side
  quad(1, 27, 29, 3, white); // right side
  quad(27, 26, 28, 29, white); // back

  // Right wall (white)
  quad(4, 5, 7, 6, white);  // front
  quad(30, 4, 6, 32, white); // left side
  quad(5, 31, 33, 7, white); // right side
  quad(31, 30, 32, 33, white); // back

  // Middle upper wall (white)
  quad(8, 9, 4, 1, white);  // front
  quad(34, 8, 1, 27, white); // top
  quad(9, 35, 30, 4, white); // bottom
  quad(35, 34, 27, 30, white); // back

  wallStart = startWall;
  wallCount = pointsArray.length - startWall;

  // --- Frame ---
  const startFrame = pointsArray.length;
  
  // Left door frame (gray)
  quad(3, 10, 8, 1, gray); // front
  quad(36, 3, 1, 37, gray); // left side
  quad(10, 38, 37, 8, gray); // top
  quad(38, 39, 36, 37, gray); // back

  // Right door frame (gray)
  quad(6, 9, 13, 7, gray);        // front
  quad(40, 6, 7, 43, gray);       // outer side
  quad(9, 41, 42, 13, gray);      // inner side
  quad(41, 40, 43, 42, gray);     // back

  // Middle upper door frame (gray)
  quad(14, 16, 17, 15, gray); // front
  quad(44, 14, 15, 45, gray); // left side
  quad(16, 46, 47, 17, gray); // right side
  quad(46, 44, 45, 47, gray); // back

  frameStart = startFrame;
  frameCount = pointsArray.length - startFrame;

  // --- Left Door ---
  const startLeftDoor = pointsArray.length;
  
  // Left door front (cyan)
  quad(18, 19, 21, 20, cyan);
  // Left door sides and back (darker cyan)
  quad(48, 49, 51, 50, vec4(0.0, 0.8, 0.8, 1.0));
  quad(18, 48, 50, 20, vec4(0.0, 0.7, 0.7, 1.0));
  quad(19, 49, 51, 21, vec4(0.0, 0.7, 0.7, 1.0));
  quad(48, 18, 20, 50, vec4(0.0, 0.6, 0.6, 1.0));

  leftDoorStart = startLeftDoor;
  leftDoorCount = pointsArray.length - startLeftDoor;

  // --- Right Door ---
  const startRightDoor = pointsArray.length;
  
  // Right door front (cyan)
  quad(22, 23, 25, 24, cyan);
  // Right door sides and back (darker cyan)
  quad(52, 53, 55, 54, vec4(0.0, 0.8, 0.8, 1.0));
  quad(22, 52, 54, 24, vec4(0.0, 0.7, 0.7, 1.0));
  quad(23, 53, 55, 25, vec4(0.0, 0.7, 0.7, 1.0));
  quad(52, 22, 24, 54, vec4(0.0, 0.6, 0.6, 1.0));

  rightDoorStart = startRightDoor;
  rightDoorCount = pointsArray.length - startRightDoor;
}

function createNode(transform, render, sibling, child){
  return { transform, render, sibling, child };
}

function initNodes(){
  // NEW: Combine translation and rotation for wall
  const wallTransform = mult(
    translate(translateX, translateY, translateZ),
    rotateY(theta)
  );
  
  const frameTransform = mat4();
  
  // Left door rotation (local transformation)
  const leftDoorTransform = mult(
    translate(-0.42, 0, 0.05),
    mult(
      rotateY(leftDoorAngle),
      translate(0.42, 0, -0.05)
    )
  );
  
  // Right door rotation (local transformation)  
  const rightDoorTransform = mult(
    translate(0.42, 0, 0.05),
    mult(
      rotateY(rightDoorAngle),
      translate(-0.42, 0, -0.05)
    )
  );

  wallNode  = createNode(wallTransform, renderWall, null, null);
  frameNode = createNode(frameTransform, renderFrame, null, null);
  leftDoorNode = createNode(leftDoorTransform, renderLeftDoor, null, null);
  rightDoorNode = createNode(rightDoorTransform, renderRightDoor, null, null);

  // Hierarchy: Wall -> Frame -> LeftDoor & RightDoor (siblings)
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

function renderWall(){ gl.drawArrays(gl.TRIANGLES, wallStart, wallCount); }
function renderFrame(){ gl.drawArrays(gl.TRIANGLES, frameStart, frameCount); }
function renderLeftDoor(){ gl.drawArrays(gl.TRIANGLES, leftDoorStart, leftDoorCount); }
function renderRightDoor(){ gl.drawArrays(gl.TRIANGLES, rightDoorStart, rightDoorCount); }

window.onload = function init(){
  canvas = document.getElementById("gl-canvas");
  gl = canvas.getContext("webgl2");
  if(!gl) alert("WebGL 2.0 isn't available");

  buildWallAndDoor();

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  gl.enable(gl.DEPTH_TEST);
  
  // Improved depth testing to reduce z-fighting
  gl.depthFunc(gl.LEQUAL);
  gl.clearDepth(1.0);

  const program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  const vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
  const vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  const cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);
  const vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

  render();
};

function render(){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  initNodes();
  modelViewMatrix = mat4();
  traverse(wallNode);
}

// Rotation controls
function rotateLeft(){ theta -= 10; render(); }
function rotateRight(){ theta += 10; render(); }
function resetRotation(){ theta = 0; render(); }

// NEW: Translation controls
function moveLeft(){ translateX -= 0.1; render(); }
function moveRight(){ translateX += 0.1; render(); }
function moveUp(){ translateY += 0.1; render(); }
function moveDown(){ translateY -= 0.1; render(); }
function moveForward(){ translateZ += 0.1; render(); }
function moveBackward(){ translateZ -= 0.1; render(); }
function resetPosition(){ 
  translateX = 0; 
  translateY = 0; 
  translateZ = 0; 
  render(); 
}

// Door animation controls - pintu membuka ke dalam
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

// NEW: Reset everything
function resetAll(){
  theta = 0;
  leftDoorAngle = 0;
  rightDoorAngle = 0;
  translateX = 0;
  translateY = 0;
  translateZ = 0;
  render();
}