'use strict';
var User = Backbone.Model.extend({
  defaults: {
    peer_id: '',
    user_name: '',
    email: '',
    src: '',
    stream: null,
    rtc_media: null,
    rtc_data: null,
    rtc_video_src: '',
    is_owner: false,
  },
  url: '#', // dummy
  initialize: function (args) {
    //super
    this.on('invalid', function(model, error){
      $("#error").html(error);
    });
  },
  validate: function(attrs) {
    // samples
    // if(_.isEmpty(attrs.user_id)){
    //   return 'user-idが指定されてません';
    // }
  },
  startRtc: function(models) {
    // WebRTC起動
    //　自分のカメラ接続を開始
    var callbacks = {
      'init': this.onYourCamera.bind(this)
    };
    this.config = models.config;
    librtc.initYourCamera(
      this.config.get('width'),
      this.config.get('height'),
      this.config.get('maxFrameRate'),
      this.config.get('minFrameRate'),
      callbacks);
  },
  onYourCamera: function(yourStream) {
    console.log('onYourCamera');
    // 自身のカメラをセット
    var src = URL.createObjectURL(yourStream);
    if (src) {
      this.set('stream',yourStream);
      this.set('src',src);
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
  createMedia: function() {
    console.log('createMedia');
    // ビデオチャット開始（You->other)
    var targetMedia = librtc.createRtcMedia(this.get('peer_id'));
    if (targetMedia) {
      // VIDEOタグを追加
      this.trigger('create_call',this);

      this.set('rtc_media',targetMedia);
      var callbacks = {
        'stream': this.onStream.bind(this),
        'close': this.onMediaClose.bind(this),
        'error': this.onMediaError.bind(this),
      };
      librtc.setMediaEvent(targetMedia,callbacks);
    } else {
      alert('test :target Media Error');
    }
  },
  closeMedia: function() {
    // ビデオチャット切断
    librtc.closeMedia(this.get('rtc_media'));
  },
  setMediaEvent: function() {
    // ビデオチャットイベントセット(Other->Youの場合)
    var callbacks = {
      'stream': this.onStream.bind(this),
      'close': this.onMediaClose.bind(this),
      'error': this.onMediaError.bind(this),
    };
    librtc.setMediaEvent(this.get('rtc_media'),callbacks);
  },
  createData: function() {
    var targetData = librtc.createRtcData(this.get('peer_id'));
    if (targetData) {
      this.set('rtc_data',targetData);
      var callbacks = {
        'data': this.onDataRecieve.bind(this),
        'open': this.onDataOpen.bind(this),
        'close': this.onDataClose.bind(this),
        'error': this.onDataError.bind(this),
      };
      librtc.setDataEvent(targetData,callbacks);
    } else {
      alert('test :target Data Error');
    }
  },
  closeData: function() {
    librtc.closeData(this.get('rtc_data'));
  },
  setDataEvent: function() {
    // データ送信イベントセット(Other->Youの場合)
    var callbacks = {
      'data': this.onDataRecieve.bind(this),
      'open': this.onDataOpen.bind(this),
      'close': this.onDataClose.bind(this),
      'error': this.onDataError.bind(this),
    };
    librtc.setDataEvent(this.get('rtc_data'),callbacks);
  },
  stopRtc: function() {
    // Peerの強制切断で一括削除
    librtc.destroy();
  },
  onPeerOpen: function(id) {
    // Peerの接続完了
    console.log('onPeerOpen');
    if (id) {
      this.set('peer_id',id);
    }
  },
  onCall : function(media) {
    // 対向からのビデオチャット受信(Yourモデルで動作)
    if (media) {
      console.log('onCall');
      this.trigger('recieve_call',media);
    }
  },
  onConnection : function(data) {
    // 対向からのデータ通信受信
    console.log('onConnection');
    if (data) {
      this.trigger('recieve_data',data);
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
  onStream: function(stream) {
    console.log('onStream');
    // 対向ノードからのビデオチャット接続完了通知を受信
    var src = URL.createObjectURL(stream);
    if (src) {
      this.set('stream',stream);
      this.set('src',src);
    }
  },
  onMediaClose: function() {
    console.log('onMediaClose');
    // ビデオチャット切断
    this.set({rtc_media: null}, {silent: true});
    this.set({stream: null}, {silent: true});
    this.set({src: ''}, {silent: true});
    this.trigger('remove_video',this);
  },
  onMediaError: function(err) {
    console.log('onMediaError');
  },
  onDataRecieve: function(data) {
    // データ受信
    console.log('onDataRecieve');
    if (!_.isEmpty(data) && !_.isEmpty(data['event_name'])) {
      this.parseData(data);
    }
  },
  onDataOpen: function() {
    // コネクションが利用可能となった
    console.log('onDataOpen');
    // 初回のプロフィール送信を実施
    this.trigger('send_profile',this);
  },
  onDataClose: function() {
    // データコネクション切断
    console.log('onDataClose');
    this.set({rtc_data: null}, {silent: true});
  },
  onDataError: function(err) {
    console.log('onDataError');
  },
  parseData: function(data) {
    // 受信データの処理を実施
    if (data['event_name'] === 'send_profile') {
      // 対向ユーザのプロフィールを受信
      var profile = data['info'];
      if (!_.isEmpty(profile)) {
        this.set('user_name',profile['user_name']);
        this.set('email',profile['email']);
      }
    } else if (data['event_name'] === 'send_chat_text') {
      // チャットテキスト受信
      var chat = data['info'];
      if (!_.isEmpty(chat)) {
        this.trigger('recieve_chat',chat);
      }
    }
  },
});

var UserCollection = Backbone.Collection.extend({
  model: User,
  initialize: function (args) {
    // super
  }
});


// 自身の情報
var UserInfoView = Backbone.View.extend({
  el: "#user-form",
  initialize: function (args) {
    // super
    this.render();
  },
  events: {
    'click #user-form-action': 'submit'
  },
  submit: function(e){
    e.preventDefault();
    if(!this.model.set(
      {
        user_name: $('#user-name').val(),
        email: $('#email').val(),
      },{validate: true})
    ){
      alert('Error!!!');
    } else {
      this.render();
    }
  },
  render: function() {
    $('#user-form').show();
    $('#rtc-view').hide();
    $('#all-user-list').hide();
    $('#rtc-text-chat-area').hide();

    $('#user-name').val(this.model.get('user_name'));
    $('#email').val(this.model.get('email'));
    return this;
  }
});
