'use strict';

// PeerJS-Serverから取得したユーザ(Peer)情報リスト
var UserPeerListView = Backbone.View.extend({
  el: "#all-user-list",
  initialize: function (args) {
    this.render();
    //this.getAllPeers();
    this.listenTo(this.collection,'add',this.addNewList);
  },
  events: {
    'click #get-all-peers': 'getAllPeers'
  },
  getAllPeers: function(e) {
    e.preventDefault();
    // Peer情報を取得
    var callback = this.onGetAllPeers.bind(this);
    librtc.getAllPeers(callback);
  },
  onGetAllPeers: function(peerIds) {
    _.each(peerIds,function(peerId){
      var isAlready = false;
      this.collection.each(function(target){
        if(target.get('peer_id') == peerId) {
          isAlready = true;
          return false;
        }
      });
      if (!isAlready) {
        var user = new User({peer_id: peerId});
        this.collection.add(user);
      }
    },this);
  },
  addNewList: function(user) {
    var newRecord = new UserRecordView({model: user});
    this.$el.find('#users-table').append(newRecord.render().el);
    return this;
  },
  render: function() {
    this.$el.find('#users-table tr.user-info').remove();
    this.collection.each(function(user){
      var newRecord = new UserRecordView({model: user});
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
    this.listenTo(this.model,'change',this.render);
    this.listenTo(this.model,'remove_video',this.render);
  },
  events: {
    'click .peerConnect': 'connectPeer',
    'click .peerDisconnect': 'disconnectPeer'
  },
  render: function(){
    var isActive = (_.isEmpty(this.model.get('src'))? false : true);
    this.$el.children().remove();
    this.$el.append(
      '<td>' + this.model.get('user_name') + '</td>'
      + '<td>' + this.model.get('peer_id') + '</td>'
      + '<td>' + this.model.get('email') + '</td>'
      + '<td>' +
        (isActive?'CONNECTED':'DISCONNECTED')
      + '</td>'
      + '<td>' +
      (this.model.get('is_owner')?"":
        (isActive
          ?'<a href="#" class="peerDisconnect btn btn-danger" peer-id="' + this.model.get('peer_id') + '">切断</a>'
          : '<a href="#" class="peerConnect btn btn-primary" peer-id="' + this.model.get('peer_id') + '">接続</a>'
        )
      )
      + '</td>'
    );
    return this;
  },
  connectPeer: function(e) {
    e.preventDefault();
    this.model.createMedia();
    // データ通信用接続も同時に行う
    this.model.createData();
  },
  disconnectPeer: function(e) {
    e.preventDefault();
    this.model.closeData();
    this.model.closeMedia();
  }
});
