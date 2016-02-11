'use strict';
var debug = true;

(function(){
  var RtcConfig = Backbone.Model.extend({
    // TODO:testコード 後で何とかしたい
    defaults: {
      appPath: '',
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
            {url: 'turn:YYY.YYY.YYY.YYY@XXX.XXX.XXX.XXX:3478', credential: 'ZZZZ' }
          ]
      },
      debug: 3,
      path: "",
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
        {"id": 7,"label": '1280x720(16:9)',"width":1280,'height':720},
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
      this.modal = new ModalVideoView({'config': this.config,'tracker': this.tracker});
      // 共通: デスクトップキャプチャリソース
      this.captureModal = new DesktopCapture({'you': this.you,'tracker': this.tracker,'config': this.config});
      this.you.setCaptureModel(this.captureModal);
      this.tracker.setCaptureModel(this.captureModal);
      // 共通: デスクトップキャプチャリソース最少化エリア
      this.captureCompress = new DesktopCaptureCompressView({'model':this.captureModal});

      this.renderInitView();
    },
    events: {
      "click #a-your-info" : "renderInitView",
      "click #a-webrtc" : "renderRtcView",
      "click #a-camera-test" : "renderCameraTest",
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
      if ($('#list-webrtc').hasClass('active')) {
        // RTC画面でRTCリンクをクリックしているか
        return;
      }

      // RTCページ表示(メニュークリック)
      this.render('#list-webrtc');

      // 機能ブロックセット
      if (_.isEmpty(this.rtcVideoView )) {
        this.rtcVideoView = new RtcVideoListView({'collection': this.collection,'model': {you: this.you,'tracker': this.tracker},'modal':this.modal});
      } else {
        this.rtcVideoView.render();
      }
      if (_.isEmpty(this.rtcUserList )) {
        this.rtcUserList = new UserPeerListView({'collection': this.collection,'model': {'tracker': this.tracker,'capture': this.captureModal}});
      } else {
        this.rtcUserList.render();
      }
      if (_.isEmpty(this.rtcTextChatView )) {
        this.rtcTextChatView = new RtcTextChatView({'collection': this.collection,'model': {'you': this.you,'tracker': this.tracker}});
      } else {
        this.rtcTextChatView.render();
      }

      if (_.isEmpty(this.rtcDesktopCaptureView )) {
        this.rtcDesktopCaptureView = new DesktopCaptureView({'model': this.captureModal});
      } else {
        this.rtcDesktopCaptureView.render();
      }
      // デスクトップキャプチャモーダル表示
      if (_.isEmpty(this.rtcDesktopCaptureModal )) {
        this.rtcDesktopCaptureModal = new DesktopCaptureModalView({'model': this.captureModal});
      }

      // あなたをコレクションに追加
      if (_.isEmpty(this.collection.get(this.you))) {
        this.collection.add(this.you);
      }

      // RTC-ON カメラ接続からSTART
      let yieldObj = this.tracker.startRtc();
      this.tracker.set('yield_obj',yieldObj);
      this.nextYield(yieldObj);
    },
    renderCameraTest: function() {
      // RTCページ表示(メニュークリック)
      this.render('#camera-list');

      if (_.isEmpty(this.cameraResultView)) {
        this.cameraResultView = new CameraResultView({'you': this.you,'config': this.config,'tracker': this.tracker});
      } else {
        this.cameraResultView.render();
      }
      // WebRTCは強制停止
      this.tracker.stopRtc();
    },
    nextYield: function(yieldObj) {
      try {
        yieldObj.next();
      } catch(e) {
        console.log(e);
        return;
      }
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
