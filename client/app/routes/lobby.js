import Ember from 'ember';

export default Ember.Route.extend({
    socket: Ember.inject.service(),
    webRTC: Ember.inject.service('web-rtc'),

    beforeModel: function() {
        return Ember.RSVP.all([
            this.get('socket').setup(),
            this.get('webRTC').setup()
        ]);
    }
});