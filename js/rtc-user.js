'use strict';

var User = Backbone.Model.extend({
  defaults: {
    peer_id: '',
    user_name: '',
    email: '',
    width: 640,
    hight: 480,
    maxFrameRate: 30,
    minFrameRate: 1,
    cameraId: 0,
    src: '',
    stream: null,
    rtc_media: null,
    rtc_data: null,
    rtc_video_src: '',
    is_owner: false,
    camera_devices: [],
    camera_id: '',
    size_id: '',
    rate_id: ''
  },
  url: '#', // dummy
  initialize: function (args) {
    //super
    this.on('invalid', function(model, error){
      $("#error").html(error);
    });
    // カメラデバイスの取得
    if (this.get('is_owner')) {
      //libMs.getMediaStreams(this.setVideDevice.bind(this));
      WebRtcAdapter.getMediaStream().getMediaStreams(this.setVideDevice.bind(this));

    }
  },
  validate: function(attrs) {
  },
  setVideDevice: function(deviceInfo) {
    if (deviceInfo !== null) {
      let devices = this.get('camera_devices');
      devices.push(deviceInfo);
      this.set('camera_devices',devices);
    } else {
      // 取得完了
      let devices = this.get('camera_devices');
      if (devices.length > 0) {
        this.trigger('refres_view');
      } else {
        alert('Camera Not Found');
      }
    }
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
  onDataRecieve: function(data) {
    // データ受信
    console.log('onDataRecieve');
    if (!_.isEmpty(data) && !_.isEmpty(data['event_name'])) {
      this.parseData(data);
    }
  },
  onDataError: function(err) {
    console.log('onDataError');
  },
  parseData: function(data) {
    // WebRTC:データコネクション制御
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
  defaults: {
    config: null
  },
  el: "#user-form",
  initialize: function (args) {
    this.config = args.config;
    // super
    this.render();
    this.listenTo(this.model,'refres_view',this.render);
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
        camera_id: $('#camera option:selected').val(),
        size_id: $('#videoSize option:selected').val(),
        rate_id: $('#frameRate option:selected').val(),
      },{validate: true})
    ){
      alert('Error!!!');
    } else {
      this.render();
    }
  },
  render: function() {
    $('#user-form').show();
    $('#rtc-view,#all-user-list,#rtc-text-chat-area').hide();

    $('#user-name').val(this.model.get('user_name'));
    $('#email').val(this.model.get('email'));
    // カメラデバイスの追加
    let devices = this.model.get('camera_devices');
    $('#camera').children().remove();
    for (let index in devices) {
      $('#camera').append(
        '<option value="' + devices[index]['id'] + '"' + ((this.model.get('camera_id') === devices[index]['id'])?' selected ':'') + '>'+ devices[index]['name'] + ' ' + devices[index]['label']  + '</option>'
      );
    }
    // 画面サイズ
    console.log('$$$$',this.model.get('size_id'));
    $('#videoSize').children().remove();
    let sizes = this.config.get('video_sizes');
    for (let index in sizes) {
      console.log('----',sizes[index]['id']);
      $('#videoSize').append(
        '<option value="' + sizes[index]['id'] + '"' + ((this.model.get('size_id') == sizes[index]['id'])?' selected ':'') + '>'+ sizes[index]['label'] + '</option>'
      );
    }
    // フレームレート
    $('#frameRate').children().remove();
    let rates = this.config.get('frame_rates');
    for (let index in rates) {
      $('#frameRate').append(
        '<option value="' + rates[index]['id'] + '"' + ((this.model.get('rate_id') == rates[index]['id'])?' selected ':'') + '>'+ rates[index]['label'] + '</option>'
      );
    }
    return this;
  }
});
