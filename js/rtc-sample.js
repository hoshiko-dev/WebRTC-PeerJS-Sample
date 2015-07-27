'use strict';
var debug = true;

(function(){
  var RtcConfig = Backbone.Model.extend({
    // TODO:testコード 後で何とかしたい
    defaults: {
      width: 960,
      height: 540,
      maxFrameRate: 30,
      minFrameRate: 1,
      rtcHost: "",
      rtcPort: 9000,
      key: "",
      config: {
          "iceServers": [
            {url: 'stun:XXX.XXX.XXX.XXX:3478'},
            {url: 'turn:hogehoge@XXX.XXX.XXX.XXX:3478', credential: 'fugafuga' }
          ]
      },
      debug: 3,
      path: ""
    },
    initialize: function (args) {
      //super
    },
    validate: function(attrs) {
    }
  });

  // サイドメニュー描画
  var MenuListView = Backbone.View.extend({
    el: "#side-menu",
    initialize: function (args) {
      // super
      // あなた自身
      this.model.you = new User({is_owner: true});

      this.renderInitView();
    },
    events: {
      "click #a-your-info" : "renderInitView",
      "click #a-webrtc" : "renderRtcView",
    },
    renderInitView: function() {
      this.render('#list-your-info');
      if (_.isEmpty(this.userInfoView)) {
        this.userInfoView = new UserInfoView({model: this.model.you});
      } else {
        this.userInfoView.render();
      }
      // WebRTCは強制停止
      this.model.you.stopRtc();
    },
    renderRtcView: function() {
      this.render('#list-webrtc');
      if (_.isEmpty(this.rtcVideoView )) {
        this.rtcVideoView = new RtcVideoListView({collection: this.collection,model: {you: this.model.you}});
      } else {
        this.rtcVideoView.render();
      }
      if (_.isEmpty(this.rtcUserList )) {
        this.rtcUserList = new UserPeerListView({collection: this.collection});
      } else {
        this.rtcUserList.render();
      }
      if (_.isEmpty(this.rtcTextChatView )) {
        this.rtcTextChatView = new RtcTextChatView({collection: this.collection,model: {you: this.model.you}});
      } else {
        this.rtcTextChatView.render();
      }
      if (_.isEmpty(this.collection.get(this.model.you))) {
        // 接続先ユーザ情報
        this.collection.add(this.model.you);
      }
      this.model.you.startRtc({config: rtcConfig});
    },
    render: function(activeId) {
      $('#side-menu li').removeClass('active');
      $(activeId).addClass('active');
      return this;
    }
  });

  // テスト
  console.log('test start');
  // 共通設定
  var rtcConfig = new RtcConfig();
  // 接続先ユーザ情報
  var targetUserCollection = new UserCollection();
  // 再度メニュー生成
  var menuListView = new MenuListView({
    model: rtcConfig,
    collection: targetUserCollection
  });
}());
