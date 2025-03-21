import { ShaderSource } from "../types/types";

export const transparency_grid = (gl: WebGL2RenderingContext, width?: number, height?: number) => {

  const vertexShaderSource = `
    attribute vec4 a_position;
    void main() {
      gl_Position = a_position;
    }
  `;

  // 0.5 = 128.0 / 256.0
  // 0.796875 = 204.0 / 256.0 
  const fragmentShaderSource = `
    precision mediump float;
    void main() {
      vec2 coord = gl_FragCoord.xy / vec2(8.0, 8.0); 
      float checkerSize = 1.0;
      
      float checkerX = mod(floor(coord.x), 2.0);
      float checkerY = mod(floor(coord.y), 2.0);
      
      float lightGray = 0.5;
      float darkGray = 0.796875;

      if (mod(checkerX + checkerY, 2.0) == 0.0) {
        gl_FragColor = vec4(lightGray, lightGray, lightGray, 1.0);
      } else {
        gl_FragColor = vec4(darkGray, darkGray, darkGray, 1.0);
      }
    }
  `;

  const compileShader = (
    gl: WebGL2RenderingContext, 
    source: ShaderSource, 
    type: GLenum
  ) => {
    const shader = gl.createShader(type) as WebGLShader;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.debug("Shader compilation failed: " + gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  const createProgram = (
    gl: WebGL2RenderingContext, 
    vertexShaderSource: ShaderSource, 
    fragmentShaderSource: ShaderSource
  ) => {
    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER) as WebGLShader;
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER) as WebGLShader;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      alert("Program linking failed: " + gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  const shaderProgram = createProgram(gl, vertexShaderSource, fragmentShaderSource) as WebGLProgram;
  gl.useProgram(shaderProgram);

  const vertices = new Float32Array([
    -1.0, 1.0,
    -1.0, -1.0,
    1.0, 1.0,
    1.0, -1.0,
  ]);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const aPositionLocation = gl.getAttribLocation(shaderProgram, "a_position");
  gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPositionLocation);

  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

}