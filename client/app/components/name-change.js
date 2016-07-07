import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'span',

    socket: Ember.inject.service(),
    user: Ember.inject.service(),

    name: Ember.computed.alias('user.current.name'),

    actions: {
        changeName() {
            this.get('user').changeName(this.get('name'));
        }
    }
});
