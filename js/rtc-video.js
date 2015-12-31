'use strict';

// RTC Viedeo List View
var RtcVideoListView = Backbone.View.extend({
  el: "#video-thumbnails",
  initialize: function (args) {
    // super

    this.modal = args.modal;

    //this.listenTo(this.collection,'add',this.addVideo);
    this.listenTo(this.collection,'create_call',this.addOtherVideo);
    this.listenTo(this.collection,'send_profile',this.sendProfile);
    this.listenTo(this.collection,'add_video_tag',this.addVideo);
    this.render();
  },
  addVideo: function(member){
    console.log('addVideo');
    if ((member.get('rtc_media') || member.get('is_owner')) && !this.isVideTagAlready(member.get('peer_id'))) {
      var newVideo = new RtcVideoTagView({'model': member,'modal': this.modal});
      this.$el.append(newVideo.render().el);
    }
  },
  addOtherVideo: function(member){
    console.log('addOtherVideo');
    var newVideo = new RtcVideoTagView({'model': member,'modal':this.modal});
    this.$el.append(newVideo.render().el);
  },
  isVideTagAlready: function(peerId) {
    if ($('#member-' + peerId).length >0) {
      return true;
    }
    return false;
  },
  render: function(){
    $('#user-form,#camera-list').hide();
    $('#rtc-view').show();
  }
});

// Videoタグ情報VIEW
var RtcVideoTagView = Backbone.View.extend({
  'tagName': 'div',
  'className': 'col-sm-4 col-md-4 col-lg-3',
  initialize: function (args) {
    // super
    this.modal = args.modal;

    this.listenTo(this.model,'change',this.render);
    this.listenTo(this.model,'remove_video',this.destory);
    this.listenTo(this.model,'destory',this.destory);
  },
  events: {
    'click .rtc-video-modal-on': 'renderModal',
    'click .rtc-video-mute-on': 'setMute',
  },
  destory: function() {
    console.log('video destory');
    //this.$el.remove();
    this.remove();
  },
  isMuted: function() {
    console.log('isMuted',$('#member-' + this.model.get('peer_id')).length);
    if ($('#member-' + this.model.get('peer_id')).length >0) {
      return $('#member-'+ this.model.get('peer_id')).prop('muted');
    } else if (this.model.get('is_owner')) {
      return true;
    }
    return false;
  },
  setMute: function(e) {
    e.preventDefault();
    console.log('setMute video:' + $('#member-'+ this.model.get('peer_id')).prop('muted'));
    if ($('#member-'+ this.model.get('peer_id')).prop('muted')) {
      $('#modal-video-view').removeAttr('muted');
      $('#modal-video-view').prop('muted',false);
      $('#member-'+ this.model.get('peer_id')).removeAttr('muted');
      $('#member-'+ this.model.get('peer_id')).prop('muted',false);
      $('#mute-member-'+ this.model.get('peer_id') + ' i').removeClass('fa-microphone-slash');
      $('#mute-member-'+ this.model.get('peer_id') + ' i').addClass('fa-microphone');
    } else {
      $('#modal-video-view').attr('muted','muted');
      $('#modal-video-view').prop('muted',true);
      $('#member-'+ this.model.get('peer_id')).attr('muted','muted');
      $('#member-'+ this.model.get('peer_id')).prop('muted',true);
      $('#mute-member-'+ this.model.get('peer_id') + ' i').removeClass('fa-microphone');
      $('#mute-member-'+ this.model.get('peer_id') + ' i').addClass('fa-microphone-slash');
    }
  },
  renderModal: function(e) {
    e.preventDefault();
    // クリックしたVideoのモーダル表示を実施
    console.log('renderModal',this.modal.attributes);
    this.modal.attributes.modal_peer_id = this.model.get('peer_id');
    this.modal.attributes.modal_user_name = this.model.get('user_name');
    this.modal.attributes.modal_src = this.model.get('src');
    this.modal.attributes.modal_is_owner = this.model.get('is_owner');
    // $('#modal-video-title').text('User Name: ' + this.model.get('user_name'));
    // $('#modal-video-view').attr('src',this.model.get('src'));

    if (!this.model.get('is_owner')) {
      // サムネイルのほうはいったんMute
      $('#member-'+ this.model.get('peer_id')).attr('muted','muted');
      $('#member-'+ this.model.get('peer_id')).prop('muted',true);
    }
    this.modal.trigger('open');
    return this;
  },
  render: function() {
    console.log('video tag render');
    this.$el.children().remove();
    this.$el.append(
      '  <div class="thumbnail">' +
      '    <a data-toggle="modal" href="#myModal" class="rtc-video-modal-on">' +
      '      <video id="member-' + this.model.get('peer_id') + '" src="' + this.model.get('src') + '" class="video-size-minimal" autoplay  ' + (this.model.get('is_owner')?" muted='muted'":"") + '></video>' +
      '     </a>' +
      '    <div class="caption pt0">' +
      '      <h6 class="caption-user-name mt0 ' +
      (this.model.get('is_owner')?'bg-primary':'bg-success') +
      '          ">name: ' + this.model.escape('user_name') + '</h6>' +
      '      <h6 class="caption-memo bg-info">peer id: ' + this.model.get('peer_id') + '</h6>' +
      '      <a href="#" id="mute-member-' + this.model.get('peer_id') + '" class="btn btn-block btn-info btn-xs rtc-video-mute-on"><i class="fa fa-' + (this.isMuted()?'microphone-slash':'microphone') + '" ></i></a>' +
      '    </div>' +
      '  </div>'
    );
    return this;
  }
});

// モーダルウインド
var ModalVideoView = Backbone.View.extend({
  el: "#myModal",
  attributes: {
    'modal_peer_id': '',
    'modal_user_name': '',
    'modal_src': '',
    'modal_is_owner': false
  },
  initialize: function (args) {
    // super
    this.listenTo(this,'open',this.initMute);
  },
  events: {
    'click .modal-video-fullscreen': 'setFullScreen',
    'click .modal-video-mute': 'setMute',
    'click .modal-video-hide': 'modalHide',
  },
  setFullScreen: function(e) {
    e.preventDefault();
    console.log('setFullScreen');
    // 全画面(Chrome Only)
    if ($('#modal-video-view')[0].webkitRequestFullscreen) {
      $('#modal-video-view')[0].webkitRequestFullscreen();
    } else {
      alert('full screen not support');
    }
  },
  modalHide: function(e) {
    console.log('modalHide');
    // closeイベントはbootstrap3側に任せる
    // video映像を削除
    $('#modal-video-view').attr('src','');
    // 強制mute
    $('#modal-video-view').prop('muted',false);
  },
  initMute: function() {
    console.log('init Mute',this.attributes.modal_is_owner);
    $('#modal-video-title').text('User Name: ' + this.attributes.modal_user_name);
    $('#modal-video-view').attr('src',this.attributes.modal_src);
    if (this.attributes.modal_is_owner) {
      $('#modal-video-view').attr('muted','muted');
      $('#modal-video-view').prop('muted',true);
      $('.modal-video-mute i').removeClass('fa-microphone');
      $('.modal-video-mute i').addClass('fa-microphone-slash');
    } else {
      $('#modal-video-view').removeAttr('muted');
      $('#modal-video-view').prop('muted',false);
      $('.modal-video-mute i').removeClass('fa-microphone-slash');
      $('.modal-video-mute i').addClass('fa-microphone');
    }
    // videoList側は強制Mute
    $('#member-'+ this.attributes.modal_peer_id).attr('muted','muted');
    $('#member-'+ this.attributes.modal_peer_id).prop('muted',true);
    $('#mute-member-'+ this.attributes.modal_peer_id + ' i').removeClass('fa-microphone');
    $('#mute-member-'+ this.attributes.modal_peer_id + ' i').addClass('fa-microphone-slash');
  },
  setMute: function(e) {
    console.log('modal Mute',$('#modal-video-view').prop('muted'));
    e.preventDefault();

    if ($('#modal-video-view').prop('muted')) {
      $('#modal-video-view').removeAttr('muted');
      $('#modal-video-view').prop('muted',false);
      $('.modal-video-mute i').removeClass('fa-microphone-slash');
      $('.modal-video-mute i').addClass('fa-microphone');
    } else {
      $('#modal-video-view').attr('muted','muted');
      $('#modal-video-view').prop('muted',true);
      $('.modal-video-mute i').removeClass('fa-microphone');
      $('.modal-video-mute i').addClass('fa-microphone-slash');
    }
  },
  render: function() {
    return this;
  }
});
