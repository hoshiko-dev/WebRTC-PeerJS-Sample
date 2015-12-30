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
  createYourPeer: function(yieldObj) {
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
    this.getLibRtc().setPeerEvent(callbacks);
  },
  createMedia: function(targetUser,yeildObj) {
    console.log('createMedia',yeildObj);
    // ビデオチャット開始（You->other)
    var targetMedia = this.getLibRtc().createRtcMedia(targetUser.get('peer_id'));
    if (targetMedia) {
      targetUser.set('rtc_media',targetMedia);
      var callbacks = {
        'stream': targetUser.onYourStream.bind(targetUser,yeildObj),
        'close': targetUser.onMediaClose.bind(targetUser),
        'error': targetUser.onMediaError.bind(targetUser),
      };
      this.getLibRtc().setMediaEvent(targetMedia,callbacks);
    }
  },
  closeMedia: function(targetUser) {
    // ビデオチャット切断
    this.getLibRtc().closeMedia(targetUser.get('rtc_media'));
  },
  setMediaEvent: function(targetUser) {
    if (!_.isEmpty(targetUser.get('rtc_media'))) {
      console.log('setMediaEvent:',targetUser);
      // ビデオチャットイベントセット(Other->Youの場合)
      var callbacks = {
        'stream': targetUser.onStream.bind(targetUser),
        'close': targetUser.onMediaClose.bind(targetUser),
        'error': targetUser.onMediaError.bind(targetUser),
      };
      this.getLibRtc().setMediaEvent(targetUser.get('rtc_media'),callbacks);
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
  closeData: function(targetUser) {
    this.getLibRtc().closeData(targetUser.get('rtc_data'));
  },
  setDataEvent: function(targetUser) {
    if (!_.isEmpty(targetUser.get('rtc_data'))) {
      console.log('setDataEvent:',targetUser);
      // データ送信イベントセット(Other->Youの場合)
      var callbacks = {
        'data': targetUser.onDataRecieve.bind(targetUser),
        'open': targetUser.onDataOpen.bind(targetUser),
        'close': targetUser.onDataClose.bind(targetUser),
        'error': targetUser.onDataError.bind(targetUser),
      };
      this.getLibRtc().setDataEvent(targetUser.get('rtc_data'),callbacks);
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
      //this.you.trigger('recieve_call',media);
      this.tracker.onRecieveCall(media);
    }
  },
  onConnection : function(data) {
    // 対向からのデータ通信受信(other->you)
    console.log('onConnection');
    if (data) {
      //this.you.trigger('recieve_data',data);
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
  getLibRtc: function() {
    return librtc;
  }
},{
  getMediaStream: function() {
    // libMediaStreamをラッピング
    return libMs;
  },
});
