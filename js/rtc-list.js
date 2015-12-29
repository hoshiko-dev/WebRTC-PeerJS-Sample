'use strict';

// PeerJS-Serverから取得したユーザ(Peer)情報リスト
var UserPeerListView = Backbone.View.extend({
  el: "#all-user-list",
  initialize: function (args) {
    this.render();
    //this.getAllPeers();
    this.listenTo(this.collection,'add',this.addNewList);
    this.listenTo(this.collection,'get_start_peer',this.getAllPeers);
  },
  events: {
    'click #get-all-peers': 'getAllPeers'
  },
  getAllPeers: function(e) {
    if (e != undefined) {
      e.preventDefault();
    }
    // Peer情報を取得
    var callback = this.onGetAllPeers.bind(this);
    this.model.tracker.getAllPeers(callback);
  },
  // callback
  onGetAllPeers: function(peerIds) {
    _.each(peerIds,function(peerId){
      let targetUser = this.collection.find(function(user){
        return (user.get('peer_id') == peerId);
      });
      if (_.isEmpty(targetUser)) {
        targetUser = new User({'peer_id': peerId,'tracker': this.model.tracker});
        this.collection.add(targetUser);
        this.model.tracker.addRtcEvent(targetUser);
      }
    },this);
  },
  addNewList: function(user) {
    var newRecord = new UserRecordView({model: {'user': user,'tracker': this.model.tracker}});
    this.$el.find('#users-table').append(newRecord.render().el);
    return this;
  },
  render: function() {
    this.$el.find('#users-table tr.user-info').remove();
    this.collection.each(function(user){
      var newRecord = new UserRecordView({model: {'user': user,'tracker': this.model.tracker}});
      this.$el.find('#users-table').append(newRecord.render().el);
    },this);
    $('#all-user-list').show();
    return this;
  }

});
// TABLEのユーザレコード
var UserRecordView = Backbone.View.extend({
  tagName: 'tr',
  className: 'user-info',
  initialize: function (args) {
    // super
    this.listenTo(this.model.user,'change',this.render);
    this.listenTo(this.model.user,'remove_video',this.render);
  },
  events: {
    'click .peerConnect': 'connectPeer',
    'click .peerDisconnect': 'disconnectPeer'
  },
  render: function(){
    var isActive = (_.isEmpty(this.model.user.get('src'))? false : true);
    this.$el.children().remove();
    this.$el.append(
      '<td class="text-center">' +
        (isActive?this.model.user.get('user_name'):'<strong class="text-danger">未接続</strong>')
      + '</td>'
      + '<td class="text-center">' + this.model.user.get('peer_id') + '</td>'
      + '<td class="text-center">' + this.model.user.get('email') + '</td>'
      + '<td class="text-center">' +
        (isActive?'CONNECTED':'DISCONNECTED')
      + '</td>'
      + '<td class="text-center">' +
      (this.model.user.get('is_owner')?"":
        (isActive
          ?'<a href="#" class="peerDisconnect btn btn-danger" peer-id="' + this.model.user.get('peer_id') + '">disconnect</a>'
          : '<a href="#" class="peerConnect btn btn-primary" peer-id="' + this.model.user.get('peer_id') + '">connect</a>'
        )
      )
      + '</td>'
    );
    return this;
  },
  //events
  connectPeer: function(e) {
    e.preventDefault();
    let yieldObj = this.model.tracker.connectPeer(this.model.user);
    this.model.tracker.set('yield_obj',yieldObj);
    //console.log(yieldObj);
    try {
      yieldObj.next();
    } catch(e) {
      console.log(e);
      return;
    }
  },
  disconnectPeer: function(e) {
    e.preventDefault();
    this.model.tracker.disconnectPeer(this.model.user);
  }
});
