'use strict';

var Tracker = Backbone.Model.extend({
  defaults: {
    peer_id: '',
  },
  url: '#', // dummy
  initialize: function (args) {
    this.you = args.you;
    this.config = args.config;
    this.collection = args.collection;
    this.adapter = new WebRtcAdapter({'you': this.you,'config': this.config,'tracker': this});

    this.listenTo(this,'close_modal',this.onCloseModal);
  },
  validate: function(attrs) {
  },
  setCaptureModel: function(capture){
    this.capture = capture
  },
  startRtc: function*() {
    // 自身のカメラ接続とPeer接続完了まではWaitさせる。
    console.log('Tracker: startRtc');
    // RTC開始 カメラ接続開始
    yield this.adapter.startRtc(this.get('yield_obj'));
    // Peer接続完了 接続完了まで待ちたい。
    yield this.adapter.createYourPeer(this.get('yield_obj'),this.you.get('stream'));
    // peerList初回取得
    this.you.trigger('get_start_peer');
    this.you.trigger('add_video_tag',this.you);
  },
  stopRtc: function() {
    console.log('Tracker: stopRtc');
    // RTC強制停止
    this.adapter.stopRtc();
  },
  connectPeer: function*(targetUser) {
    targetUser.set('connectGen',this.connectPeer);
    let mediaCallback = {
      'stream': targetUser.onYourStream.bind(targetUser,this.get('yield_obj')),
      'close': targetUser.onMediaClose.bind(targetUser),
      'error': targetUser.onMediaError.bind(targetUser),
    };
    let options = {'metadata': {'type': 'video'}};
    // 対向との接続開始(Video/Data);
    this.adapter.createMedia(targetUser,this.you.get('stream'),mediaCallback,options,'video');
    this.adapter.createData(targetUser,this.get('yield_obj'));
    yield;
    yield;
    // 接続完了後、初回のプロフィール送信を実施
    this.sendProfile(targetUser);
  },
  disconnectPeer: function(targetUser) {
    this.adapter.closeData(targetUser.get('rtc_media'));
    this.adapter.closeMedia(targetUser.get('rtc_data'));
  },
  sendProfile: function(target) {
    console.log('sendProfile',this.you.get('user_name'));
    // 対向にあなたの情報を送信
    var targetDataCon = target.get('rtc_data');
    var profile = {
      'event_name': 'send_profile',
      'info' : {
        'user_name': this.you.get('user_name'),
        'email': this.you.get('email')
      }
    }
    this.adapter.sendData(targetDataCon,profile);
  },
  onRecieveCall: function(media) {
    // 対向からのビデオチャット通知受信部
    console.log('onRecieveCall:',media.peer);
    let targetUser = this.collection.find(function(user){
      return (user.get('peer_id') == media.peer);
    });
    console.log('#####  targetUser search:',targetUser);
    if (!_.isEmpty(targetUser)) {
      targetUser.setMedia(media,media.metadata.type);
    } else {
      console.log('new User Video tag');
      targetUser = new User({'peer_id': media.peer,'tracker': this, 'capture': this.capture});
      targetUser.setMedia(media,media.metadata.type);
      this.collection.add(targetUser);
    }
    let callbacks = {};
    if (media.metadata.type == 'screen') {
      // デスクトップキャプチャイベントセット(Other->Youの場合)
      callbacks = {
        'stream': targetUser.onScreenStream.bind(targetUser),
        'close': targetUser.onScreenClose.bind(targetUser),
        'error': targetUser.onMediaError.bind(targetUser),
      };
    } else {
      // ビデオチャットイベントセット(Other->Youの場合)
      callbacks = {
        'stream': targetUser.onStream.bind(targetUser),
        'close': targetUser.onMediaClose.bind(targetUser),
        'error': targetUser.onMediaError.bind(targetUser),
      };
    }
    // このタイミングで初めてイベントセットするケースがありうる
    this.adapter.setMediaEvent(media,callbacks);
  },
  onRecieveData: function(data) {
    // データ通信の接続要求を受信
    console.log('onRecieveData:',data.peer);
    let targetUser = this.collection.find(function(user){
      return (user.get('peer_id') == data.peer);
    });
    if (!_.isEmpty(targetUser)) {
      targetUser.set('rtc_data',data);
    } else {
      console.log('new User Video tag');
      targetUser = new User({'peer_id': data.peer,'rtc_data': data,'tracker': this});
      this.collection.add(targetUser);
    }
    // このタイミングで初めてイベントセットするケースがありうる
    let callbacks = {
      'data': targetUser.onDataRecieve.bind(targetUser),
      'open': targetUser.onDataOpen.bind(targetUser),
      'close': targetUser.onDataClose.bind(targetUser),
      'error': targetUser.onDataError.bind(targetUser),
    };
    this.adapter.setDataEvent(targetUser.get('rtc_data'),callbacks);
  },
  addRtcEvent: function(targetUser) {
    // getAllPeers直後は空振りする可能性あり
    let callbacks = {
      'stream': targetUser.onStream.bind(targetUser),
      'close': targetUser.onMediaClose.bind(targetUser),
      'error': targetUser.onMediaError.bind(targetUser),
    };
    this.adapter.setMediaEvent(targetUser.get('rtc_media'),callbacks);
    callbacks = {
      'data': targetUser.onDataRecieve.bind(targetUser),
      'open': targetUser.onDataOpen.bind(targetUser),
      'close': targetUser.onDataClose.bind(targetUser),
      'error': targetUser.onDataError.bind(targetUser),
    };
    this.adapter.setDataEvent(targetUser.get('rtc_data'),callbacks);
  },
  getAllPeers: function(callback) {
    this.adapter.getAllPeers(callback);
  },
  sendTextChat: function(text){
    console.log('sendTextChat text:',text);
    if (!_.isEmpty(text)) {
      // 対象全員に送信
      this.collection.each(function(member){
        if (!member.get('is_owner')) {
          var chat = {
            'event_name': 'send_chat_text',
            'info' : {
              'text': text,
              'user_name': this.you.get('user_name'),
              'post_date': this.getNowDate()
            }
          }
          this.adapter.sendData(member.get('rtc_data'),chat);
        } else {
          // 自分自身に対しては描画処理だけ
          var chat = {
            'text': text,
            'user_name': this.you.get('user_name'),
            'post_date': this.getNowDate()
          }
          this.collection.trigger('recieve_chat',chat);
        }
      },this);
    }
  },
  getNowDate: function() {
    var date = new Date();
    return ([date.getFullYear(), date.getMonth() + 1, date.getDate()].join('/') + ' ' + date.toLocaleTimeString());
  },
  getCameraTestResults: function(param,callback) {
    WebRtcAdapter.getCamera().getCameraTestResults(param,callback);
  },
  testCameraRender: function(param,callback) {
    WebRtcAdapter.getCamera().getCameraTestResults(param,callback);
  },
  startDesktopCapture: function*(extId,params) {
    this.you.set('is_screen_capture',true);
    let callbacks = {
      'init': this.you.onYourScreen.bind(this.you,this.get('screen_yield_obj'))
    };
    // デスクトップキャプチャ接続開始
    yield this.adapter.startDesktopCapture(extId,params,callbacks);
    // デスクトップキャプチャのMedia送信開始
    // 対象全員に送信
    console.log('broadcast Desktop capure!');
    this.collection.each(function(targetUser) {
        // Videoチャット未接続の場合は対象外
      if (!_.isEmpty(targetUser.get('peer_id'))
        && targetUser.get('peer_id') !== this.you.get('peer_id')
        && targetUser.get('src') !== '') {
        let callbacks = {
          'stream': targetUser.onScreenStream.bind(targetUser),
          'close': targetUser.onScreenClose.bind(targetUser),
          'error': targetUser.onMediaError.bind(targetUser),
        };
        let options = {'metadata': {'type': 'screen'}};
        console.log('my screen stream',this.you.get('screen_stream'));
        this.adapter.createMedia(targetUser,this.you.get('screen_stream'),callbacks,options,'screen');
      }
    },this);
    // modal起動
    this.capture.trigger('open_capture_modal',this.you.get('peer_id'),this.you.get('user_name'),this.you.get('screen_src'));
  },
  stopDesktopCapture: function() {
    this.you.set('is_screen_capture',false);
    this.you.trigger('screen_state_change',false);
    this.collection.each(function(targetUser) {
      if (!_.isEmpty(targetUser.get('peer_id')) && targetUser.get('peer_id') !== this.you.get('peer_id')) {
        this.adapter.closeMedia(targetUser.get('rtc_screen'));
      }
    },this);
    this.adapter.stopDesktopCapture();
  },
  onCloseModal: function(peerId,isMuted) {
    // Videoチャットモーダルのクローズイベント
    console.log('closeModal',peerId,isMuted);
    let member = this.collection.find(function(member){
      return peerId === member.get('peer_id');
    });
    if (!_.isEmpty(member)) {
      member.trigger('close_modal',isMuted);
    }
  }
});
