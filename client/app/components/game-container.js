import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['game-container'],

  init: function() {
    this._super();
    Ember.run.scheduleOnce('afterRender', this, this.initScene);
  },

  canvasId: Ember.computed('elementId', function() {
    return `${this.elementId}-game-canvas`;
  }),

  initScene() {
    var canvas = document.getElementById(this.elementId);
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    this._viewport = {
      height: height,
      width: width,
      left: -width / 2,
      right: width / 2,
      top: height / 2,
      bottom: -height / 2,
      near: -100,
      far: 100
    }

    let scene = new THREE.Scene();
    this._scene = scene;

    this._camera = new THREE.OrthographicCamera(
      this._viewport.left,
      this._viewport.right,
      this._viewport.top,
      this._viewport.bottom,
      this._viewport.near,
      this._viewport.far);

    let renderer = new THREE.WebGLRenderer();
    this._renderer = renderer;
    renderer.setSize(width, height);
    canvas.appendChild(renderer.domElement);

    this.draw();
  },

  draw() {
    this._drawPaddles();
    this._drawBall();

    this._renderer.render(this._scene, this._camera);

    requestAnimationFrame(this.draw.bind(this));
  },

  _drawPaddles() {
    let paddleHeight = this._viewport.height * 0.1;
    let paddleWidth = this._viewport.width * 0.01;
    let paddleGeometry = new THREE.BoxGeometry( paddleWidth, paddleHeight, 0 );
    let paddleMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff } );

    let paddle1 = new THREE.Mesh( paddleGeometry, paddleMaterial );
    paddle1.position.x = this._viewport.left + 10;
    this._scene.add(paddle1);

    var paddle2 = new THREE.Mesh( paddleGeometry, paddleMaterial );
    paddle2.position.x = this._viewport.right - 10;
    this._scene.add(paddle2);
  },

  _drawBall() {
    let ballSize = this._viewport.height * 0.01;
    var geometry = new THREE.BoxGeometry( ballSize, ballSize, 0 );
    var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    var cube = new THREE.Mesh( geometry, material );
    this._scene.add( cube );
  }
});
