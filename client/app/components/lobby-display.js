import Ember from 'ember';

export default Ember.Component.extend({
    socket: Ember.inject.service(),
    webRTC: Ember.inject.service('web-rtc'),

    users: null,

    init() {
        this._super();
        this.set('users', []);
        this.set('challenges', []);

        this.get('socket').on('user-connected', user => {
            if(this.get('users').filterBy('id', user.id).length === 0) {
                this.get('users').pushObject(user);
            }
        });

        this.get('socket').on('user-disconnected', userId => {
            this.set('users', this.get('users').filter(existingUser => {
                return existingUser.id !== userId;
            }));
        });

        this.get('socket').on('user-challenged', challengeData => {
            let challenger = this.get('users').findBy('id', challengeData.challenger.id);

            if(!Ember.isNone(challenger)) {
                challenger.set('hasChallenged', true);
            }
        });

        this.get('socket.initPromise')
            .then(() => {
                Ember.$.getJSON('http://pong-cnatis.c9users.io:8080/connectedUsers', result => {
                    let sessionId = this.get('socket.sessionId');
                    this.get('users').pushObjects(result.users.filter(user => {
                        return user.id !== sessionId;
                    }).map(user => Ember.Object.create(user)));
                });
            });
    },

    actions: {
        challenge(userId) {
            let url = `http://pong-cnatis.c9users.io:8080/user/${this.get('socket.sessionId')}/challenge/${userId}`;
            Ember.$.post(url, {});
        },

        acceptChallenge(userId) {
            let challenger = this.get('users').findBy('id', userId);
            this.get('webRTC').startConnection(true, {
                challenger: challenger.id,
                challengee: this.get('socket.sessionId')
            });
        }
    }
});
