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
  },
  validate: function(attrs) {
  },
  startRtc: function*() {
    // 自身のカメラ接続とPeer接続完了まではWaitさせる。
    console.log('Tracker: startRtc');
    // RTC開始 カメラ接続開始
    yield this.adapter.startRtc(this.get('yield_obj'))
    // Peer接続完了 接続完了まで待ちたい。
    yield this.adapter.createYourPeer(this.get('yield_obj'));
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

    // 対向との接続開始(Video/Data);
    this.adapter.createMedia(targetUser,this.get('yield_obj'));
    this.adapter.createData(targetUser,this.get('yield_obj'));
    yield;
    yield;
    // 接続完了後、初回のプロフィール送信を実施
    this.sendProfile(targetUser);
  },
  disconnectPeer: function(targetUser) {
    this.adapter.closeData(targetUser);
    this.adapter.closeMedia(targetUser);
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
    var isAlready = false;
    var targetUser = null;
    this.collection.each(function(target){
      console.log(target);
      if(target.get('peer_id') == media.peer) {
        console.log('isAlready');
        // 既存Peer検出
        isAlready = true;
        target.set('rtc_media',media);
        targetUser = target;
        //targetUser.trigger('add_video_tag',targetUser);
        return false;
      }
    },this);
    if (!isAlready) {
      console.log('new User Video tag');
      // 新規Peer検出
      targetUser = new User({'peer_id': media.peer,'rtc_media': media,'tracker': this});
      this.collection.add(targetUser);
    }
    // VIDEOタグ自体は次のonStreamでやれる
    if (targetUser) {
      this.adapter.setMediaEvent(targetUser);
    }
  },
  onRecieveData: function(data) {
    // データ通信の接続要求を受信
    console.log('onRecieveData:',data.peer);
    var isAlready = false;
    var targetUser = null;
    this.collection.each(function(target){
      console.log(target);
      if(target.get('peer_id') == data.peer) {
        console.log('isAlready');
        // 既存Peer検出
        isAlready = true;
        target.set('rtc_data',data);
        targetUser = target;
        return false;
      }
    });
    if (!isAlready) {
      console.log('new');
      // 新規Peer検出
      targetUser = new User({'peer_id': data.peer,'rtc_data': data,'tracker': this});
      this.collection.add(targetUser);
    }
    if (targetUser) {
      this.adapter.setDataEvent(targetUser);
    }
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
              'user_name': this.model.you.get('user_name'),
              'post_date': this.getNowDate()
            }
          }
          this.adapter.sendData(member.get('rtc_data'),chat);
        } else {
          // 自分自身に対しては描画処理だけ
          var chat = {
            'text': text,
            'user_name': this.model.you.get('user_name'),
            'post_date': this.getNowDate()
          }
          this.trigger('recieve_chat',chat);
        }
      },this);
    }
  },
  getNowDate: function() {
    var date = new Date();
    return ([date.getFullYear(), date.getMonth() + 1, date.getDate()].join('/') + ' ' + date.toLocaleTimeString());
  },
});
