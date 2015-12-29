'use strict';
var debug = true;

(function(){
  var RtcConfig = Backbone.Model.extend({
    // TODO:testコード 後で何とかしたい
    defaults: {
      appPath: '/webRTC-PeerJS-Sample/',
      width: 960,
      height: 540,
      maxFrameRate: 30,
      minFrameRate: 1,
      rtcHost: "hoshiko-dev.net",
      rtcPort: 9000,
      key: "hoshiko-dev",
      config: {
          "iceServers": [
            {url: 'stun:hoshiko-dev.net:3478'},
            {url: 'turn:hoshiko-dev@hoshiko-dev.net:3478', credential: 'hogehogefugafuga' }
          ]
      },
      debug: 3,
      path: "peerjs/",
      frame_rates: [
        {"id": 1,"label": 'max:30 min:1',"min":1,"max":30},
        {"id": 2,"label": 'max:5 min:1',"min":1,"max":5},
        {"id": 3,"label": 'max:10 min:1',"min":1,"max":10},
        {"id": 4,"label": 'max:15 min:1',"min":1,"max":15},
        {"id": 5,"label": 'max:20 min:1',"min":1,"max":20},
        {"id": 6,"label": 'max:40 min:1',"min":1,"max":40},
        {"id": 7,"label": 'max:50 min:1',"min":1,"max":50},
        {"id": 8,"label": 'max:60 min:1',"min":1,"max":60},
      ],
      video_sizes: [
        {"id": 1,"label": '960x540(16:9)',"width":960,'height':540},
        {"id": 2,"label": '640x480(4:3)',"width":640,'height':480},
        {"id": 3,"label": '192x108(16:9)',"width":192,'height':108},
        {"id": 4,"label": '320x180(16:9)',"width":320,'height':180},
        {"id": 5,"label": '480x270(16:9)',"width":480,'height':270},
        {"id": 6,"label": '640x360(16:9)',"width":640,'height':360},
        {"id": 7,"label": '1248x702(16:9)',"width":1248,'height':702},
        {"id": 8,"label": '1440x810(16:9)',"width":1440,'height':810},
        {"id": 9,"label": '1920x1080(16:9)',"width":1920,'height':1080},
        {"id":10,"label": '320x240(4:3)',"width":320,'height':240},
        {"id":11,"label": '480x360(4:3)',"width":480,'height':360},
        {"id":12,"label": '800x600(4:3)',"width":800,'height':600},
        {"id":13,"label": '1280x960(4:3)',"width":1280,'height':960},
        {"id":14,"label": '1600x1200(4:3)',"width":1600,'height':1200}
      ]
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

      // 共通設定
      this.config = new RtcConfig();

      // 接続先ユーザ情報コレクション
      this.collection = new UserCollection();

      // あなた自身
      this.you = new User({is_owner: true});
      this.tracker = new Tracker({'you': this.you,'config': this.config,'collection': this.collection});
      this.you.set('tracker',this.tracker);

      // 共通:モーダルウインドリソース
      this.modal = new ModalVideoView({'config': this.config});

      this.renderInitView();
    },
    events: {
      "click #a-your-info" : "renderInitView",
      "click #a-webrtc" : "renderRtcView",
    },
    renderInitView: function() {
      // 初期表示
      this.render('#list-your-info');
      if (_.isEmpty(this.userInfoView)) {
        this.userInfoView = new UserInfoView({'model': this.you,'config': this.config});
      } else {
        this.userInfoView.render();
      }
      // WebRTCは強制停止
      this.tracker.stopRtc();
    },
    renderRtcView: function() {
      // RTCページ表示(メニュークリック)
      this.render('#list-webrtc');

      // 機能ブロックセット
      if (_.isEmpty(this.rtcVideoView )) {
        this.rtcVideoView = new RtcVideoListView({'collection': this.collection,'model': {you: this.you,'tracker': this.tracker},'modal':this.modal});
      } else {
        this.rtcVideoView.render();
      }
      if (_.isEmpty(this.rtcUserList )) {
        this.rtcUserList = new UserPeerListView({'collection': this.collection,'model': {'tracker': this.tracker}});
      } else {
        this.rtcUserList.render();
      }
      if (_.isEmpty(this.rtcTextChatView )) {
        this.rtcTextChatView = new RtcTextChatView({'collection': this.collection,'model': {'you': this.you,'tracker': this.tracker}});
      } else {
        this.rtcTextChatView.render();
      }

      // あなたをコレクションに追加
      if (_.isEmpty(this.collection.get(this.you))) {
        this.collection.add(this.you);
      }

      // RTC-ON カメラ接続からSTART
      let yieldObj = this.tracker.startRtc();
      this.tracker.set('yield_obj',yieldObj);
      //console.log(yieldObj);
      try {
        yieldObj.next();
      } catch(e) {
        console.log(e);
        return;
      }
      //console.log(yieldObj);
      //yieldObj.next(yieldObj);
    },
    render: function(activeId) {
      $('#side-menu li').removeClass('active');
      $(activeId).addClass('active');
      return this;
    }
  });
  // サイドメニュー生成
  var menuListView = new MenuListView();
  // router
  var router = new RtcRouter({'you' : menuListView.you});

  Backbone.history.start({'pushState':false,'root':menuListView.config.get('appPath')});
}());
