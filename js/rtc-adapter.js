'use strict';

// peerjsのAdapterクラス
var WebRtcAdapter = Backbone.Model.extend({
  defaults: {
    config: null
  },
  initialize: function (args) {
    //super

    this.config = args.config;
    this.you = args.you;

    this.on('invalid', function(model, error){
      //$("#error").html(error);
    });
  },
  validate: function(attrs) {
  },
  startRtc: function() {
    console.log('startRTC');
    // WebRTC起動
    //　自分のカメラ接続を開始
    var callbacks = {
      'init': this.onYourCamera.bind(this)
    };
    var width = this.config.get('width');
    var height = this.config.get('height');
    var sizes = this.config.get('video_sizes');
    var rates = this.config.get('frame_rates');
    for (let size in sizes) {
    console.log('KKK',size,this.you.get('size_id'));
      if (sizes[size]['id'] == this.you.get('size_id')) {
        console.log('HOGE');
        width = sizes[size]['width'];
        height =  sizes[size]['height'];
        break;
      }
    }
    console.log('hoge',width,height);
    let maxFrame = this.config.get('maxFrameRate');
    let minFrame = this.config.get('minFrameRate');
    for(let rate in rates) {
      if (rates[rate]['id'] == this.you.get('rate_id')) {
        maxFrame = rates[rate]['max'];
        minFrame = rates[rate]['min'];
        break;
      }
    }
    console.log('hoge',width,height,maxFrame,minFrame);
    librtc.initYourCamera(
      width,
      height,
      maxFrame,
      minFrame,
      this.you.get('camera_id'),
      callbacks);
  },
  stopRtc: function() {
    // Peerの強制切断で一括削除
    librtc.destroy();
  },
  onYourCamera: function(yourStream) {
    console.log('onYourCamera');
    // 自身のカメラをvideoタグにセット
    var src = URL.createObjectURL(yourStream);
    if (src) {
      this.you.set('stream',yourStream);
      this.you.set('src',src);
      this.createYourPeer();
    }
  },
  createYourPeer: function() {
    console.log('createYourPeer');
    // PeerJSの接続開始
    librtc.createYourPeer(
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
      'open': this.onPeerOpen.bind(this),
      'call': this.onCall.bind(this),
      'connection': this.onConnection.bind(this),
      'close': this.onPeerClose.bind(this),
      'disconnected': this.onDisconnected.bind(this),
      'error': this.onPeerError.bind(this),
    };
    librtc.setPeerEvent(callbacks);
  },
  createMedia: function(targetModel) {
    console.log('createMedia');
    // ビデオチャット開始（You->other)
    var targetMedia = librtc.createRtcMedia(this.get('peer_id'));
    if (targetMedia) {
      // VIDEOタグを追加
      targetModel.trigger('create_call',targetModel);

      targetModel.set('rtc_media',targetMedia);
      var callbacks = {
        'stream': targetModel.onStream.bind(targetModel),
        'close': targetModel.onMediaClose.bind(targetModel),
        'error': targetModel.onMediaError.bind(targetModel),
      };
      librtc.setMediaEvent(targetMedia,callbacks);
    }
  },
  closeMedia: function(targetModel) {
    // ビデオチャット切断
    librtc.closeMedia(targetModel.get('rtc_media'));
  },
  setMediaEvent: function(targetModel) {
    // ビデオチャットイベントセット(Other->Youの場合)
    var callbacks = {
      'stream': targetModel.onStream.bind(targetModel),
      'close': targetModel.onMediaClose.bind(targetModel),
      'error': targetModel.onMediaError.bind(targetModel),
    };
    librtc.setMediaEvent(targetModel.get('rtc_media'),callbacks);
  },
  createData: function(targetModel) {
    var targetData = librtc.createRtcData(targetModel.get('peer_id'));
    if (targetData) {
      targetModel.set('rtc_data',targetData);
      var callbacks = {
        'data': targetModel.onDataRecieve.bind(targetModel),
        'open': targetModel.onDataOpen.bind(targetModel),
        'close': targetModel.onDataClose.bind(targetModel),
        'error': targetModel.onDataError.bind(targetModel),
      };
      librtc.setDataEvent(targetData,callbacks);
    }
  },
  closeData: function(targetModel) {
    librtc.closeData(targetModel.get('rtc_data'));
  },
  setDataEvent: function(targetModel) {
    // データ送信イベントセット(Other->Youの場合)
    var callbacks = {
      'data': targetModel.onDataRecieve(targetModel),
      'open': targetModel.onDataOpen.bind(targetModel),
      'close': targetModel.onDataClose.bind(targetModel),
      'error': targetModel.onDataError.bind(targetModel),
    };
    librtc.setDataEvent(targetModel.get('rtc_data'),callbacks);
  },

  sendData: function(targetCon,data) {
    librtc.sendData(targetCon,data);
  },
  getAllPeers: function(callback) {
    librtc.getAllPeers(callback);
  },
  onPeerOpen: function(id) {
    // Peerの接続完了
    console.log('onPeerOpen:',id);
    if (id) {
      this.you.set('peer_id',id);
    }
  },
  onCall : function(media) {
    // 対向からのビデオチャット受信(Yourモデルで動作)
    if (media) {
      console.log('onCall');
      this.you.trigger('recieve_call',media);
    }
  },
  onConnection : function(data) {
    // 対向からのデータ通信受信(other->you)
    console.log('onConnection');
    if (data) {
      this.you.trigger('recieve_data',data);
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
},{
  getMediaStream: function() {
    return libMs;
  },
});
