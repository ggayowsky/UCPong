import Ember from 'ember';
import { EKMixin, keyUp, keyDown } from 'ember-keyboard';

export default Ember.Component.extend(EKMixin, {
  classNames: ['game-container'],

  init: function() {
    this._super();
    this._paddle1Height = 0;
    this._paddle2Height = 0;

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

    this._initPaddles();

    this.draw();
  },

  draw() {
    this._drawBall();

    this._renderer.render(this._scene, this._camera);

    requestAnimationFrame(this.draw.bind(this));
  },

  _initPaddles() {
    const paddleHeight = this._viewport.height * 0.1;
    const paddleWidth = this._viewport.width * 0.01;
    const  paddleGeometry = new THREE.BoxGeometry( paddleWidth, paddleHeight, 0 );
    const paddleMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff } );

    this.paddle1 = new THREE.Mesh( paddleGeometry, paddleMaterial );
    this.paddle1.position.x = this._viewport.left + 10;
    this.paddle1.position.y = this._paddle1Height;
    this._scene.add(this.paddle1);

    this.paddle2 = new THREE.Mesh( paddleGeometry, paddleMaterial );
    this.paddle2.position.x = this._viewport.right - 10;
    this.paddle2.position.y = this._paddle2Height;
    this._scene.add(this.paddle2);
  },

  _drawBall() {
    let ballSize = this._viewport.height * 0.01;
    var geometry = new THREE.BoxGeometry( ballSize, ballSize, 0 );
    var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    var cube = new THREE.Mesh( geometry, material );
    this._scene.add( cube );
  },

  _movePaddle(direction) {
    switch(direction) {
      case 'up':
        this.paddle1.position.y++;
        break;
      case 'down':
        this.paddle1.position.y--;
        break;
    }
  },

  keyDown: Ember.on(keyDown('ArrowUp'), function() {
    console.log('Up pressed');
    this._movePaddle('up');
  }),

  keyUp: Ember.on(keyDown('ArrowDown'), function() {
    console.log('Down pressed');
    this._movePaddle('down');
  })
});
