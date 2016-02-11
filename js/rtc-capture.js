'use strict';

// デスクトップキャプチャー制御
var DesktopCapture = Backbone.Model.extend({
  defaults: {
    peer_id: '',
    user_name: '',
    width: 1440,
    height: 810,
    maxFrameRate: 30,
    minFrameRate: 1,
    extensionId: '',
    cameraId: 0,
    src: '',
    stream: null,
    rtc_media: null,
    rtc_data: null,
    is_owner: false,
    screen_size_id: 1,
    desktop_sizes: [
      {"id": 1,"label": '1366x768(16:9)',"width":1440,'height':810},
      {"id": 2,"label": '640x360(16:9)',"width":640,'height':360},
      {"id": 3,"label": '1280x720(16:9)',"width":1280,'height':720},
      {"id": 4,"label": '1920x1080(16:9)',"width":1920,'height':1080},
      {"id": 5,"label": '640x480(4:3)',"width":640,'height':480},
      {"id": 6,"label": '800x600(4:3)',"width":800,'height':600},
      {"id": 7,"label": '1280x960(4:3)',"width":1280,'height':960}
    ]
  },
  url: '#', // dummy
  initialize: function (args) {
    //super
    this.tracker = args.tracker;
    this.you = args.you;

    this.listenTo(this,'invalid',this.onIinvalid);
  },
  validate: function(attrs) {
  },
  onIinvalid: function(model,error) {
    console.log('onIinvalid',error);
  },
  onMediaError: function(err) {
    console.log('onMediaError');
  },
  startDesktopCapture: function(extId,sizeId) {
    this.set({
      'extensionId': extId,
      'screen_size_id': sizeId,
      'peer_id': this.you.get('peer_id')
    });
    let size = this.get('desktop_sizes').find(function(size,index){
      return (size['id'] == this.get('screen_size_id'))?true:false;
    },this);
    if (_.isEmpty(size)) {
      size = {'width': this.get('width'),'height': this.get('height')};
    }
    let params = {
      'width': size['width'],
      'height': size['height'],
      'maxFrameRate': this.get('maxFrameRate'),
      'minFrameRate': this.get('minFrameRate')
    }
    // デスクトップキャプチャ接続からSTART
    let yieldObj = this.tracker.startDesktopCapture(extId,params);
    this.tracker.set('screen_yield_obj',yieldObj);
    this.nextYield(yieldObj);
  },
  stopScreenCapture: function() {
    if (this.isCaptureOwner(this.you.get('peer_id'))) {
      // 自分自身からの発信の場合はキャプチャ切断開始
      this.tracker.stopDesktopCapture();
    }
    this.set('user_name','');
    this.set('src','');
    this.set('peer_id','');
  },
  isCaptureOwner: function(peerId) {
    let capPeerId = this.get('peer_id');
    if (_.isEmpty(capPeerId) && peerId !== undefined) {
      // 対向側からのキャプチャ
      this.set('peer_id',peerId);
      return true;
    } else if (!_.isEmpty(capPeerId) && capPeerId === peerId) {
      // 自分からのCaptureを想定
      return true;
    }
    return false;
  },
  nextYield: function(yieldObj) {
    try {
      yieldObj.next();
    } catch(e) {
      console.log(e);
      return;
    }
  }
});

// RTC-VIEWのDesktopCaptureブロック表示
var DesktopCaptureView = Backbone.View.extend({
  el: "#desktop-capture-edit",
  initialize: function (args) {
    this.render();
  },
  events: {
    'click #get-desktop-capture': 'startDesktopCapture',
  },
  startDesktopCapture: function(e) {
    e.preventDefault();
    let extId = $('#desktop-capture-extension-id').val();
    let sizeId = $('#select-desktop-size option:selected').val();
    if (!_.isEmpty(extId)) {
      this.model.startDesktopCapture(extId,sizeId);
    } else {
      alert('Chrome Extension Id not found!');
    }
  },
  render: function() {
    // 画面サイズ
    $('#select-desktop-size').children().remove();
    let sizes = this.model.get('desktop_sizes');
    for (let index in sizes) {
      $('#select-desktop-size').append(
        '<option value="' + sizes[index]['id'] + '"' + ((this.model.get('screen_size_id') == sizes[index]['id'])?' selected ':'') + '>'+ sizes[index]['label'] + '</option>'
      );
    }
    $('#web-rtc-view').show();
    return this;
  }
});

// Desktop Captureモーダル VIEW
var DesktopCaptureModalView = Backbone.View.extend({
  el: "#desktop-capture-modal",
  initialize: function (args) {
    //this.getAllPeers();
    this.listenTo(this.model,'open_capture_modal',this.onOpenModal);
    this.listenTo(this.model,'close_modal',this.onCloseModal);
  },
  events: {
    'click .modal-desktop-fullscreen': 'setFullScreen',
    'click .modal-desktop-capture-close': 'closeModal',
    'click .modal-desktop-compress': 'compressModal'
  },
  setFullScreen: function(e) {
    e.preventDefault();
    console.log('setFullScreen');
    // 全画面(Chrome Only)
    if ($('#modal-desktop-view')[0].webkitRequestFullscreen) {
      $('#modal-desktop-view')[0].webkitRequestFullscreen();
    } else {
      alert('full screen not support');
    }
  },
  onOpenModal: function(peerId,name,src) {
    console.log('openModal',peerId,name,src,this.$el.css('display'));
    if (this.model.isCaptureOwner(peerId)) {
      if (this.$el.css('display') !== 'block') {
        this.model.set('user_name',name);
        this.model.set('src',src);
        $('#modal-desktop-name').text(this.model.get('user_name'));
        $('#modal-desktop-view').attr('src',this.model.get('src'));
        $('#desktop-capture-modal').modal();
      }
    }
  },
  onCloseModal: function() {
    $('#modal-desktop-name').text('');
    $('#modal-desktop-view').attr('src','');
    $('#desktop-capture-modal').modal('hide');
    this.model.stopScreenCapture();
  },
  closeModal: function(e) {
    // クローズイベントはBootstrap3に任せる
    this.onCloseModal();
  },
  compressModal: function(e) {
    e.preventDefault();
    console.log('compressModal');
    // 左袖に縮小表示
    this.model.trigger('compress_modal');
    $('#modal-desktop-view').attr('src','');
    $('#desktop-capture-modal').modal('hide');
    // Desktopcaptureエリアのスタートボタンを抑止

  },
  unCompreeModal: function() {
    // Desktopcaptureエリアのスタートボタンを解放
  },
  render: function() {
    return this;
  }
});

// Desktop Captureモーダル 最少化VIEW
var DesktopCaptureCompressView = Backbone.View.extend({
  el: "#desktop-capture-compress-view",
  initialize: function (args) {
    this.listenTo(this.model,'compress_modal',this.onOpenCompressArea);
    this.render();
  },
  events: {
    'click #desktop-capture-compress-video': 'closeCompressArea',
  },
  onOpenCompressArea: function() {
    console.log('openCompressArea',this.$el.css('display'));
    if (this.$el.css('display') !== 'block') {
      this.$el.show();
      $('#compress-desktop-name').text(this.model.get('user_name'));
      $('#desktop-capture-compress-video').attr('src',this.model.get('src')).addClass('link-anchor');
    }
  },
  closeCompressArea: function(e) {
    if (this.$el.css('display') === 'block') {
      this.$el.hide();
      this.model.trigger('open_capture_modal',this.model.get('peer_id'),this.model.get('user_name'),this.model.get('src'));
      $('#compress-desktop-name').text('');
      $('#desktop-capture-compress-video').attr('src','').removeClass('link-anchor');
    }
  },
  render: function() {
    this.$el.hide();
    return this;
  }
});
