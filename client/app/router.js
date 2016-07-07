import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('lobby', { path: '/' });
  this.route('game');
});

export default Router;
