import Ember from 'ember';

export default Ember.Component.extend({
    socket: Ember.inject.service(),

    name: null,

    actions: {
        changeName() {
            this.get('socket.initPromise')
                .then(() => {
                    let newName = this.get('name');
                    let url = `http://localhost:3000/user/${this.get('socket.sessionId')}/name`;
                    console.log(this.get('socket.sessionId'), url);
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
