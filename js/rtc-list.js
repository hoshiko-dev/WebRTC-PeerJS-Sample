'use strict';

// PeerJS-Serverから取得したユーザ(Peer)情報リスト
var UserPeerListView = Backbone.View.extend({
  el: "#all-user-list",
  initialize: function (args) {
    this.render();
    //this.getAllPeers();
    this.listenTo(this.collection,'add',this.onAddNewList);
    this.listenTo(this.collection,'get_start_peer',this.onGetAllPeers);
    this.listenTo(this.collection,'remove',this.render);
  },
  events: {
    'click #get-all-peers': 'getAllPeers'
  },
  // callback
  onCallbackGetAllPeers: function(peerIds) {
    _.each(peerIds,function(peerId){
      let targetUser = this.collection.find(function(user){
        return (user.get('peer_id') == peerId);
      });
      if (_.isEmpty(targetUser)) {
        targetUser = new User({'peer_id': peerId,'tracker': this.model.tracker,'capture': this.model.capture});
        console.log('user list new User:',targetUser);
        this.collection.add(targetUser);
        this.model.tracker.addRtcEvent(targetUser);
      }
    },this);
    // CollectionからPeerIdsに存在Userを削除
    let idList = this.collection.pluck('peer_id');
    let removeTargets = _.difference(idList,peerIds);
    if (!_.isEmpty(removeTargets)) {
      let removeUsers = this.collection.filter(function(user){
        return (_.contains(removeTargets,user.get('peer_id')));
      });
      console.log('user list remove users',removeUsers);
      this.collection.remove(removeUsers,{'slient': true});
      _.each(removeUsers,function(user) {
        console.log('destory User',user);
        user.destroy();
      });
    }
  },
  onGetAllPeers: function() {
    // Peer情報を取得
    var callback = this.onCallbackGetAllPeers.bind(this);
    this.model.tracker.getAllPeers(callback);
  },
  onAddNewList: function(user) {
    console.log('onAddNewList:',user);
    var newRecord = new UserRecordView({model: {'user': user,'tracker': this.model.tracker}});
    this.$el.find('#users-table').append(newRecord.render().el);
    return this;
  },
  getAllPeers: function(e) {
    e.preventDefault();
    this.onGetAllPeers();
  },
  render: function() {
    this.$el.find('#users-table tr.user-info').remove();
    console.log('user list render:',this.collection.length);
    this.collection.each(function(user){
      var newRecord = new UserRecordView({model: {'user': user,'tracker': this.model.tracker}});
      this.$el.find('#users-table').append(newRecord.render().el);
    },this);
    $('#web-rtc-view').show();
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
    this.listenTo(this.model.user,'destroy',this.onDestroy);
    this.listenTo(this.model.user,'screen_state_change',this.onScreenIcon);
  },
  events: {
    'click .peerConnect': 'connectPeer',
    'click .peerDisconnect': 'disconnectPeer'
  },
  // events
  onDestroy: function() {
    console.log('List User Record destroy',this.model.user);
    this.remove();
  },
  onScreenIcon: function(isOpen) {
    console.log('onScreenIcon',isOpen);
    if ($('#capture-icon-' + this.model.user.get('peer_id')).length > 0) {
      if (isOpen) {
        $('#capture-icon-' + this.model.user.get('peer_id') + ' i').removeClass('hide');
      } else {
        $('#capture-icon-' + this.model.user.get('peer_id') + ' i').addClass('hide');
      }
    }
  },
  // action
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
  },
  render: function(){
    var isActive = (_.isEmpty(this.model.user.get('src'))? false : true);
    this.$el.children().remove();
    this.$el.append(
      '<td class="text-center">' +
        (isActive?this.model.user.get('user_name'):'<strong class="text-danger">未接続</strong>')
      + '</td>'
      + '<td class="text-center">' + this.model.user.escape('peer_id') + '</td>'
      + '<td class="text-center">' + this.model.user.escape('email') + '</td>'
      + '<td class="text-center">' +
        (isActive?'CONNECTED':'DISCONNECTED')
      + '</td>'
      + '<td class="text-center" id="capture-icon-' + this.model.user.get('peer_id') + '"><i class="fa fa-desktop ml5 mr5 label-fa hide"></i></td>'
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
  }
});
