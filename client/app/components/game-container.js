import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['game-container'],

  init: function() {
    this._super();
    Ember.run.scheduleOnce('afterRender', this, this.initCanvas);
  },

  canvasId: Ember.computed('elementId', function() {
    return `${this.elementId}-game-canvas`;
  }),

  initCanvas() {
    var canvas = document.getElementById(this.get('canvasId'));
    // Initialize the GL context
    let gl = this._initWebGL(canvas);
    this._gl = gl;

    if(gl) {
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      // Enable depth testing
      gl.enable(gl.DEPTH_TEST);
      // Near things obscure far things
      gl.depthFunc(gl.LEQUAL);
      // Clear the color as well as the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    } else {
      // RIP
    }
  },

  draw() {
    requestAnimationFrame(this.draw.bind(this));
  },

  _initWebGL(canvas) {
    let gl = null;

    try {
      // Try to grab the standard context. If it fails, fallback to experimental.
      gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }
    catch(e) {}

    // If we don't have a GL context, give up now
    if (!gl) {
      alert("Unable to initialize WebGL. Your browser may not support it.");
      gl = null;
    }

    return gl;
  }
});
