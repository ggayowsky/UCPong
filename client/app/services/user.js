import Ember from 'ember';

export default Ember.Service.extend({
    socket: Ember.inject.service(),

    current: null,

    setup() {
        this.get('socket.initPromise')
            .then(() => {
                this.set('current', Ember.Object.create({
                    id: this.get('socket.sessionId'),
                    name: this.get('socket.sessionId')
                }));

                this.get('socket').on('user-name-changed', userData => {
                    console.log(userData);
                    if(userData.id === this.get('current.id')) {
                        this.set('current.name', userData.name);
                    }
                });
            });
    }
});
