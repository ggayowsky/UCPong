import Ember from 'ember';

import ENV from 'pong/config/environment';

export default Ember.Service.extend({
    socket: Ember.inject.service(),

    current: null,

    setup() {
        this.get('socket.initPromise')
            .then(() => {
                let id = this.get('socket.sessionId');
                let name = id;
                if(localStorage.getItem('name')){
                    name = localStorage.getItem('name');
                    this.changeName(name);
                }

                this.set('current', Ember.Object.create({
                    id: id,
                    name: name
                }));

                this.get('socket').on('user-name-changed', userData => {
                    console.log(userData);
                    if(userData.id === this.get('current.id')) {
                        this.set('current.name', userData.name);
                    }
                });
            });
    },

    changeName(newName) {
        let url = `${ENV.HOST}/user/${this.get('socket.sessionId')}/name`;
        let data = {
            name: newName
        };
        localStorage.setItem('name', newName);
        Ember.$.post(url, data);
    }
});
