import Ember from 'ember';

export default Ember.Route.extend({
    webRTC: Ember.inject.service('web-rtc'),

    beforeModel() {
        console.log(this.get('webRTC.isConnected'));
        if(!this.get('webRTC.isConnected')) {
            this.transitionTo('lobby');
        }

        this.get('webRTC').on('webrtc-closed', this.gameEnded.bind(this));
    },

    willDestroy() {
        this.get('webRTC').off('webrtc-closed', this.gameEnded.bind(this));
        this._super();
    },

    actions: {
        leaveGame() {
            this.get('webRTC').closeConnection();
            this.transitionTo('lobby');
        }
    },

    gameEnded() {
        this.get('webRTC').closeConnection();
        this.transitionTo('lobby');
    }
});
