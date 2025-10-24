"use strict";

let canvas, gl;
let pointsArray = [];
let colorsArray = [];

const red =  vec4(1.0, 0.0, 0.0, 1.0);
const gray = vec4(0.8, 0.8, 0.8, 1.0);
const white = vec4(1.0, 1.0, 1.0, 1.0);
const cyan  = vec4(0.0, 1.0, 1.0, 1.0);

const vertices = [
  // --- Wall 1–10 ---
  // Left wall
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

function quad(a, b, c, d, color) {
  // push two triangles (a,b,c) and (a,c,d)
  pointsArray.push(vertices[a], vertices[b], vertices[c]);
  pointsArray.push(vertices[a], vertices[c], vertices[d]);
  for (let i = 0; i < 6; i++) colorsArray.push(color);
}

// hierarchical variables
let modelViewMatrix, modelViewMatrixLoc;
let stack = [];
let wallNode, frameNode, doorNode;
let theta = 0;
let wallStart, frameStart, doorStart;
let wallCount, frameCount, doorCount;

function buildWallAndDoor() {
  // compute starts and counts dynamically
  const startWall = pointsArray.length;

  quad(0, 1, 3, 2, white);  // left wall
  quad(26, 2, 0, 24, white);
  quad(3, 27, 25, 1, white);
  quad(27, 26, 24, 25, white);

  quad(4, 5, 7, 6, white);  // right wall
  quad(7, 31, 29, 5, white);
  quad(30, 6, 4, 28, white);
  quad(31, 30, 28, 29, white);

  quad(8, 9, 4, 1, white);  // middle upper wall
  quad(25, 1, 4, 28, white);
  quad(8, 32, 33, 9, white);


  wallStart = startWall;
  wallCount = pointsArray.length - startWall;

  // --- Frame ---
  const startFrame = pointsArray.length;
  quad(3, 11, 10, 8, gray); // left door frame
  quad(11, 37, 36, 10, gray);
  quad(37, 34, 35, 36, gray);

  quad(13, 6, 9, 12, gray); // right door frame
  quad(41, 13, 12, 40, gray);
  quad(38, 41, 40, 39, gray);

  quad(15, 17, 16, 14, gray); // middle upper door frame
  quad(43, 45, 17, 15, gray);
  quad(45, 43, 42, 44, gray);

  frameStart = startFrame;
  frameCount = pointsArray.length - startFrame;

  // --- Doors (left and right) ---
  const startDoor = pointsArray.length;
  quad(11, 19, 18, 20, cyan); // left door
  quad(19, 48, 47, 18, cyan);
  quad(18, 47, 49, 20, cyan);
  quad(48, 46, 49, 47, cyan);

  quad(22, 13, 23, 21, cyan); // right door
  quad(52, 22, 21, 51, cyan);
  quad(51, 21, 23, 53, cyan);
  quad(50, 52, 51, 53, cyan);

  doorStart = startDoor;
  doorCount = pointsArray.length - startDoor;
}

function createNode(transform, render, sibling, child){
  return { transform, render, sibling, child };
}

function initNodes(){
    const wallTransform  = rotateY(theta);
    const frameTransform = mult(translate(0.0, 0.0, 0.03), mat4());
    const doorTransform  = mult(translate(0.0, 0.0, 0.03), mat4());


  wallNode  = createNode(wallTransform, renderWall, null, null);
  frameNode = createNode(frameTransform, renderFrame, null, null);
  doorNode  = createNode(doorTransform, renderDoor, null, null);

  wallNode.child  = frameNode;
  frameNode.child = doorNode;
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
function renderDoor(){ gl.drawArrays(gl.TRIANGLES, doorStart, doorCount); }

window.onload = function init(){
  canvas = document.getElementById("gl-canvas");
  gl = canvas.getContext("webgl2");
  if(!gl) alert("WebGL 2.0 isn't available");

  buildWallAndDoor();

  // Do NOT override automatically computed counts.
  // wallCount/frameCount/doorCount already set inside buildWallAndDoor.

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  gl.enable(gl.DEPTH_TEST);

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

function rotateLeft(){ theta -= 10; render(); }
function rotateRight(){ theta += 10; render(); }
function resetRotation(){ theta = 0; render(); }
