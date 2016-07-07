import Ember from 'ember';
import ENV from 'pong/config/environment';

export default Ember.Component.extend({
    socket: Ember.inject.service(),
    webRTC: Ember.inject.service('web-rtc'),
    user: Ember.inject.service(),

    currentUser: Ember.computed.alias('user.current'),

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

        this.get('socket').on('user-name-changed', userData => {
            let user = this.get('users').findBy('id', userData.id);
            if(!Ember.isNone(user)) {
                user.set('name', userData.name);
            }
        });

        this.get('socket.initPromise')
            .then(() => {
                Ember.$.getJSON(`${ENV.HOST}/connectedUsers`, result => {
                    let sessionId = this.get('socket.sessionId');
                    this.get('users').pushObjects(result.users.filter(user => {
                        return user.id !== sessionId;
                    }).map(user => Ember.Object.create(user)));
                });
            });
    },

    actions: {
        challenge(userId) {
            let url = `${ENV.HOST}/user/${this.get('socket.sessionId')}/challenge/${userId}`;
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
