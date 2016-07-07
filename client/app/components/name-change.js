import Ember from 'ember';
import ENV from 'pong/config/environment';

export default Ember.Component.extend({
    socket: Ember.inject.service(),

    name: null,

    actions: {
        changeName() {
            this.get('socket.initPromise')
                .then(() => {
                    let newName = this.get('name');
                    let url = `${ENV.HOST}/user/${this.get('socket.sessionId')}/name`;
                    let data = {
                        name: newName
                    };
                    Ember.$.post(url, data, (result) => {
                        console.log(result);
                    });
                });
        }
    }
});
