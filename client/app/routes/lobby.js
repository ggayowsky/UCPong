import Ember from 'ember';

export default Ember.Route.extend({
    socket: Ember.inject.service(),
    webRTC: Ember.inject.service('web-rtc'),

    beforeModel: function() {
        this.get('webRTC').on('webrtc-ready', this.startGame.bind(this));
    },

    startGame() {
        this.transitionTo('game');
    }
});