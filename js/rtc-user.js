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
    screen_src: '',
    stream: null,
    screen_stream: null,
    rtc_media: null,
    rtc_screen: null,
    rtc_data: null,
    is_owner: false,
    is_screen_capture: false,
    camera_devices: [],
    camera_id: null,
    size_id: '1',
    rate_id: '1',
    connect_yeild: null,
    disconnect_yeild: null
  },
  url: '#', // dummy
  initialize: function (args) {
    //super
    this.tracker = args.tracker;
    if (args.capture != undefined) {
      this.capture = args.capture;
    }

    this.listenTo(this,'invalid',this.onIinvalid);
    // カメラデバイスの取得
    if (this.get('is_owner')) {
      WebRtcAdapter.getMediaStream().getMediaStreams(this.setVideDevice.bind(this));
    }
  },
  validate: function(attrs) {
  },
  onIinvalid: function(model,error) {
    console.log('onIinvalid',error);
  },
  setCaptureModel: function(capture) {
    console.log('capture get!',this.get('user_name'));
    this.capture = capture;
  },
  setMedia: function(media,mediaType) {
    // MediaStreamをセット
    if (mediaType !== undefined && mediaType === 'screen') {
      media.metadata = {'type': 'screen'};
      this.set('rtc_screen',media);
    } else {
      media.metadata = {'type': 'video'};
      this.set('rtc_media',media);
    }
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
  onYourStream: function(yeildObj,stream) {
    console.log('onYourStream',yeildObj,stream);
    // 対向ノードからのビデオチャット接続完了通知を受信
    var src = URL.createObjectURL(stream);
    if (src) {
      this.set('stream',stream);
      this.set('src',src);
      this.trigger('add_video_tag',this);
    }
    // Trackerを動かす
    this.nextYield(yeildObj);
  },
  onStream: function(stream) {
    console.log('onStream',stream);
    // 対向ノードからのビデオチャット接続完了通知を受信
    var src = URL.createObjectURL(stream);
    if (src) {
      this.set('stream',stream);
      this.set('src',src);
      // videoタグ作成
      this.trigger('add_video_tag',this);
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
  onYourDataOpen: function(yeildObj) {
    // コネクションが利用可能となった
    console.log('onYourDataOpen',yeildObj);
    // Trackerを動かす
    this.nextYield(yeildObj);
  },
  onDataOpen: function() {
    // コネクションが利用可能となった
    console.log('onDataOpen');
    console.log(this.tracker);
    this.tracker.sendProfile(this);
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
  onYourScreen: function(yieldObj,screenStream) {
    console.log('onYourScreen',screenStream);
    // デスクトップキャプチャをvideoタグにセット
    var src = URL.createObjectURL(screenStream);
    if (src) {
      this.set('screen_stream',screenStream);
      this.set('screen_src',src);
      this.trigger('screen_state_change',true);
    }
    yieldObj.next();
  },
  onScreenStream: function(stream) {
    console.log('onScreenStream',stream);
    // 対向ノードからのデスクトップキャプチャ接続完了通知を受信
    var src = URL.createObjectURL(stream);
    if (src) {
      this.set('screen_stream',stream);
      this.set('screen_src',src);
      // リストにデスクトップキャプチャアイコンを表示
      this.trigger('screen_state_change',true);
      if (!_.isEmpty(this.capture)) {
        // デスクトップmodal表示
        this.capture.trigger('open_capture_modal',this.get('peer_id'),this.get('user_name'),src);
      } else {
        alert('capture not found');
      }
    }
  },
  onScreenClose: function() {
    console.log('onScreenClose');
    // デスクトップキャプチャ切断
    this.set({'rtc_screen': null}, {silent: true});
    this.set({'screen_stream': null}, {silent: true});
    this.set({'screen_src': ''}, {silent: true});
    // リストにデスクトップキャプチャアイコンを表示
    this.trigger('screen_state_change',false);
    // modalクローズ
    this.capture.trigger('close_modal',this);
  },
  nextYield: function(obj) {
    try {
      obj.next()
    } catch(e) {
      console.log('yiled Error:',e);
      if (! (e instanceof StopIteration)) throw e;
    }
  }
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
    $('#camera-list,#web-rtc-view').hide();

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
    if (!_.isEmpty(devices) && this.model.get('camera_id') == null) {
      // 初回
      this.model.set('camera_id',devices[0]['id']);
    }
    // 画面サイズ
    $('#videoSize').children().remove();
    let sizes = this.config.get('video_sizes');
    for (let index in sizes) {
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
