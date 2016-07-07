import Ember from 'ember';

import ENV from 'pong/config/environment';

export default Ember.Service.extend(Ember.Evented, {
    // Properties
    initPromise: null,
    sessionId: null,

    // Methods
    setup() {
        this.set('initPromise', new Ember.RSVP.Promise((resolve) => {
            this._socket = io(ENV.HOST);
            this._socket.on('connect', () => {
                this.set('sessionId', this._socket.id);
                this._socket.on('user-connected', this.userConnectedHandler.bind(this));
                this._socket.on('user-disconnected', this.userDisconnectedHandler.bind(this));
                this._socket.on('user-challenged', this.userChallengedHandler.bind(this));
                this._socket.on('sdp-description', this.sdpDescriptionHandler.bind(this));
                this._socket.on('ice-candidate', this.iceCandidateHandler.bind(this));
                resolve();
            });
        }));
        return this.get('initPromise');
    },

    emit(eventName, data) {
        return this._socket.emit(eventName, data);
    },

    // Socket event handlers
    userConnectedHandler(data) {
        if(data && data.user && data.user.id !== this.get('sessionId')) {
            this.trigger('user-connected', Ember.Object.create(data.user));
        }
    },

    userDisconnectedHandler(data) {
        if(data && data.user && data.user.id !== this.get('sessionId')) {
            this.trigger('user-disconnected', data.user.id);
        }
    },

    userChallengedHandler(data) {
        if(data && data.challengee && data.challengee.id === this.get('sessionId')) {
            this.trigger('user-challenged', data);
        }
    },

    sdpDescriptionHandler(data) {
        data.sdp = JSON.parse(data.sdp);
        this.trigger('sdp-description', data);
    },

    iceCandidateHandler(data) {
        data.ice = JSON.parse(data.ice);
        this.trigger('ice-candidate', data);
    }
});
