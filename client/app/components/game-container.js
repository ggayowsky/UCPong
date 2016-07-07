import Ember from 'ember';
import { EKMixin, keyUp, keyDown } from 'ember-keyboard';

const ballSpeed = 1.5;

export default Ember.Component.extend(EKMixin, {
  // Component properties
  classNames: ['game-container'],

  // Services
  webRTC: Ember.inject.service('web-rtc'),

  score: null,

  networkThrottle: 1,

  init: function() {
    this._super();
    this.set('score', [0,0]);
    this.myPaddleHeight = 0;
    this._paddle2Height = 0;
    this._ballXDir = Math.round(Math.random()) === 0 ? -1 : 1;
    this._ballYDir = Math.round(Math.random()) === 0 ? -1 : 1;

    this.get('webRTC').on('data', this._networkDataHandler.bind(this));

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
    };

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
    this._initBall();

    this.draw();
  },

  draw() {
    this._updateBall();

    this._renderer.render(this._scene, this._camera);

    requestAnimationFrame(this.draw.bind(this));
  },

  _initPaddles() {
    const paddleHeight = this._viewport.height * 0.1;
    const paddleWidth = this._viewport.width * 0.01;
    const  paddleGeometry = new THREE.BoxGeometry( paddleWidth, paddleHeight, 0 );
    const paddleMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff } );

    this.myPaddle = new THREE.Mesh( paddleGeometry, paddleMaterial );
    if(this.get('webRTC.isHost')) {
      this.myPaddle.position.x = this._viewport.left + 10;
    } else {
      this.myPaddle.position.x = this._viewport.right - 10;
    }

    this.myPaddle.position.y = this.myPaddleHeight;
    this._scene.add(this.myPaddle);

    this.paddle2 = new THREE.Mesh( paddleGeometry, paddleMaterial );
    if(this.get('webRTC.isHost')) {
      this.paddle2.position.x = this._viewport.right - 10;
    } else {
      this.paddle2.position.x = this._viewport.left + 10;
    }
    this.paddle2.position.y = this._paddle2Height;
    this._scene.add(this.paddle2);
  },

  _initBall() {
    const ballSize = this._viewport.height * 0.02;
    const ballGeometry = new THREE.BoxGeometry( ballSize, ballSize, 0 );
    const ballMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    this._ball = new THREE.Mesh( ballGeometry, ballMaterial );
    this._scene.add( this._ball );
  },

  _movePaddle(direction) {
    const bbox = new THREE.Box3().setFromObject(this.myPaddle);

    switch(direction) {
      case 'up':
        if(bbox.max.y + 1 < this._viewport.top ) {
          this.myPaddle.translateY(1);
          this.myPaddleHeight++;
        }
        break;
      case 'down':
        if(bbox.min.y - 1 > this._viewport.bottom ) {
          this.myPaddle.translateY(-1);
          this.myPaddleHeight--;
        }
        break;
    }
    Ember.run.throttle(this, this._sendData, this.get('networkThrottle'));
  },

  keyDown: Ember.on(keyDown('ArrowUp'), function() {
    console.log('Up pressed');
    this._movePaddle('up');
  }),

  keyUp: Ember.on(keyDown('ArrowDown'), function() {
    console.log('Down pressed');
    this._movePaddle('down');
  }),

  _updateBall() {
    if(!this.get('webRTC.isHost')) {
      return;
    }

    let ballYPosition = this._ball.position.y;
    let ballXPosition = this._ball.position.x;

    // Wall Collision Logic
    if( ballYPosition + this._ballYDir * ballSpeed > this._viewport.top ||
        ballYPosition + this._ballYDir * ballSpeed < this._viewport.bottom ) {
      this._ballYDir = - this._ballYDir;
    }

    this._ball.position.y += this._ballYDir * ballSpeed;

    // Paddle Collision Logic
    let myPaddlebbox = new THREE.Box3().setFromObject(this.myPaddle);
    let paddle2bbox = new THREE.Box3().setFromObject(this.paddle2);

    if(myPaddlebbox.min.x < ballXPosition && myPaddlebbox.max.x > ballXPosition &&
      myPaddlebbox.min.y < ballYPosition && myPaddlebbox.max.y > ballYPosition ) {
      this._ballXDir = - this._ballXDir;
    }

    if(paddle2bbox.min.x < ballXPosition && paddle2bbox.max.x > ballXPosition &&
      paddle2bbox.min.y < ballYPosition && paddle2bbox.max.y > ballYPosition ) {
      this._ballXDir = - this._ballXDir;
    }

    // Scoring Logic
    if( ballXPosition < this._viewport.left) {
      this._ball.position.x = 0;
      this._ball.position.y = 0;
      // Player 2 scored
      this.set('score.1', this.get('score.1') + 1);

      this._ballXDir = - this._ballXDir;
      this._ballYDir = Math.round(Math.random()) === 0 ? -1 : 1;

    } else if ( ballXPosition > this._viewport.right ) {
      this._ball.position.x = 0;
      this._ball.position.y = 0;
      // Player 1scored
      this.set('score.0', this.get('score.0') + 1);

      this._ballXDir = - this._ballXDir;
      this._ballYDir = Math.round(Math.random()) === 0 ? -1 : 1;
    } else {
      this._ball.position.x += this._ballXDir * ballSpeed;
    }

    Ember.run.throttle(this, this._sendData, this.get('networkThrottle'));
  },

  _sendData() {
    let webRTC = this.get('webRTC');
    if(webRTC.get('isHost')) {
      webRTC.send({
        ball: this._ball.position,
        localPaddle: this.myPaddle.position,
        remotePaddel: this.paddle2.position
      });
    } else {
      webRTC.send({
        localPaddle: this.myPaddle.position
      });
    }
  },

  _networkDataHandler(data) {
    this.paddle2.position.y = data.localPaddle.y;
    if(!this.get('webRTC.isHost')) {
      this._ball.position.x = data.ball.x;
      this._ball.position.y = data.ball.y;
    }
  }
});
