var RtcRouter = Backbone.Router.extend({
    routes : {
        ':name'           : 'index',
    },
    initialize: function(args) {
      this.you = args.you;
    },
    index : function index(name) {
        if (!_.isEmpty(name)) {
          console.log('Set default name:', name);
          this.you.set('user_name',name);
        }
    },
});
