'use strict';

// peerjsのAdapterクラス
var WebRtcAdapter = Backbone.Model.extend({
  defaults: {
    config: null,
    width: '',
    height: '',
    maxFrame: '',
    minFrame: '',
  },
  self: WebRtcAdapter,
  initialize: function (args) {
    //super

    this.config = args.config;
    this.you = args.you;
    this.tracker = args.tracker;

    this.on('invalid', function(model, error){
      //$("#error").html(error);
    });
  },
  validate: function(attrs) {
  },
  startRtc: function(yieldObj) {
    console.log('startRTC');
    // WebRTC起動
    //　自分のカメラ接続を開始
    var callbacks = {
      'init': this.onYourCamera.bind(this,yieldObj)
    };
    this.setUpMediaParams();
    this.getLibRtc().initYourCamera(
      this.width,
      this.height,
      this.maxFrame,
      this.minFrame,
      this.you.get('camera_id'),
      callbacks);
  },
  stopRtc: function() {
    // Peerの強制切断で一括削除
    this.getLibRtc().destroy();
  },
  onYourCamera: function(yieldObj,yourStream) {
    console.log('onYourCamera');
    // 自身のカメラをvideoタグにセット
    var src = URL.createObjectURL(yourStream);
    if (src) {
      this.you.set('stream',yourStream);
      this.you.set('src',src);
    }
    yieldObj.next();
  },
  createYourPeer: function(yieldObj,myStream) {
    console.log('createYourPeer');
    // PeerJSの接続開始
    this.getLibRtc().createYourPeer(
      this.config.get('rtcHost'),
      this.config.get('rtcPort'),
      this.config.get('key'),
      this.config.get('config'),
      this.config.get('debug'),
      this.config.get('path'),
      this.config.get('secure'),
      this.config.get('id')
    );
    var callbacks = {
      'open': this.onPeerOpen.bind(this,yieldObj),
      'call': this.onCall.bind(this),
      'connection': this.onConnection.bind(this),
      'close': this.onPeerClose.bind(this),
      'disconnected': this.onDisconnected.bind(this),
      'error': this.onPeerError.bind(this),
    };
    this.getLibRtc().setPeerEvent(callbacks,myStream);
  },
  createMedia: function(targetUser,myStream,callbacks,options,mediaType) {
    console.log('createMedia');
    // ビデオチャット開始（You->other)
    let targetMedia = this.getLibRtc().createRtcMedia(targetUser.get('peer_id'),myStream,options);
    if (targetMedia) {
      targetUser.setMedia(targetMedia,mediaType);
      this.getLibRtc().setMediaEvent(targetMedia,callbacks);
    }
  },
  closeMedia: function(targetMedia) {
    if (!_.isEmpty(targetMedia)) {
      // ビデオチャット切断
      this.getLibRtc().closeMedia(targetMedia);
    }

  },
  setMediaEvent: function(targetMedia,callbacks) {
    if (!_.isEmpty(targetMedia)) {
      console.log('setMediaEvent:',targetMedia);
      // ビデオチャットイベントセット(Other->Youの場合)
      this.getLibRtc().setMediaEvent(targetMedia,callbacks);
    }
  },
  createData: function(targetUser,yeildObj) {
    if (!_.isEmpty(targetUser.get('peer_id'))) {
      var targetData = this.getLibRtc().createRtcData(targetUser.get('peer_id'));
      if (!_.isEmpty(targetData)) {
        targetUser.set('rtc_data',targetData);
        console.log('createData',yeildObj);
        var callbacks = {
          'data': targetUser.onDataRecieve.bind(targetUser),
          'open': targetUser.onYourDataOpen.bind(targetUser,yeildObj),
          'close': targetUser.onDataClose.bind(targetUser),
          'error': targetUser.onDataError.bind(targetUser),
        };
        this.getLibRtc().setDataEvent(targetData,callbacks);
      }
    }
  },
  closeData: function(targetData) {
    if (!_.isEmpty(targetData)) {
      // ビデオチャット切断
      this.getLibRtc().closeData(targetData);
    }
  },
  setDataEvent: function(targetData,callbacks) {
    if (!_.isEmpty(targetData)) {
      console.log('setDataEvent:',targetData);
      // データ送信イベントセット(Other->Youの場合)
      this.getLibRtc().setDataEvent(targetData,callbacks);
    }
  },

  sendData: function(targetCon,data) {
    this.getLibRtc().sendData(targetCon,data);
  },
  getAllPeers: function(callback) {
    this.getLibRtc().getAllPeers(callback);
  },
  onPeerOpen: function(yieldObj,id) {
    // Peerの接続完了
    console.log('onPeerOpen:',id);
    if (id) {
      this.you.set('peer_id',id);
    }
    yieldObj.next();
  },
  onCall : function(media) {
    // 対向からのビデオチャット受信(Yourモデルで動作)
    if (media) {
      console.log('onCall');
      this.tracker.onRecieveCall(media);
    }
  },
  onConnection : function(data) {
    // 対向からのデータ通信受信(other->you)
    console.log('onConnection');
    if (data) {
      this.tracker.onRecieveData(data);
    }
  },
  onPeerClose : function() {
    console.log('onPeerClose');
  },
  onDisconnected : function() {
    console.log('onDisconnected');
  },
  onPeerError : function(err) {
    console.log('onPeerError');
    // TODO: VIDEOタグ、リスト表示をリフレッシュ
    // peer.js改造しないと判定できないかも
    //this.trigger('remove_video',this);
  },
  setUpMediaParams: function() {
    // video-sizeとFrameRateの設定(デフォルト、画面から取得)
    this.width = this.config.get('width');
    this.height = this.config.get('height');
    let size = this.config.get('video_sizes').find(function(size,index){
      return (size['id'] == this.you.get('size_id'))?true:false;
    },{'you': this.you});
    //if (size.length > 0) {
    if (!_.isEmpty(size)) {
      //this.width = size[0]['width'];
      this.width = size['width'];
      //this.height = size[0]['height'];
      this.height = size['height'];
    }

    this.maxFrame = this.config.get('maxFrameRate');
    this.minFrame = this.config.get('minFrameRate');
    let frame = this.config.get('frame_rates').find(function(frame,index) {
      return (frame['id'] == this.you.get('rate_id'))?true:false;
    },{'you': this.you});
    //if (frame.length > 0) {
    if (!_.isEmpty(frame)) {
      //this.maxFrame = frame[0]['max'];
      this.maxFrame = frame['max'];
      //this.minFrame = frame[0]['min'];
      this.minFrame = frame['min'];
    }
    console.log('setUp VideoSize/FrameRate:',this.width,this.height,this.maxFrame,this.minFrame);
  },
  startDesktopCapture: function(extId,params,yieldObj) {
    var callbacks = {
      'init': this.onYourScreen.bind(this,yieldObj)
    };
    this.getLibCapture().startDesktopCapture(extId,params,callbacks);
  },
  onYourScreen: function(yieldObj,screenStream) {
    console.log('onYourScreen');
    // デスクトップキャプチャをvideoタグにセット
    var src = URL.createObjectURL(screenStream);
    if (src) {
      this.you.set('screen_stream',screenStream);
      this.you.set('screen_src',src);
    }
    yieldObj.next();
  },
  stopDesktopCapture: function() {
    this.getLibCapture().stopCapture();
  },
  getLibRtc: function() {
    return librtc;
  },
  getLibCapture: function() {
    return libCapture;
  }
},{
  getMediaStream: function() {
    // libMediaStreamをラッピング
    return libMs;
  },
  getCamera: function() {
    // libCameraをラッピング
    return libCamera;
  },
});
