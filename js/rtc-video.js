'use strict';

// RTC Viedeo List View
var RtcVideoListView = Backbone.View.extend({
  el: "#video-thumbnails",
  initialize: function (args) {
    // super

    this.modal = args.modal;
    this.tracker = args.tracker;

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
    $('#web-rtc-view').show();
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
    this.listenTo(this.model,'close_modal',this.closeModal);
    this.listenTo(this.model,'remove_video',this.destory);
    this.listenTo(this.model,'destory',this.destory);
  },
  events: {
    'click .rtc-video-modal-on': 'openModal',
    'click .rtc-video-mute-on': 'toggleMute',
  },
  destory: function() {
    console.log('video destory');
    //this.$el.remove();
    this.remove();
  },
  isMuted: function(isOwner) {
    console.log('isMuted',$('#member-' + this.model.get('peer_id')).length);
    if ($('#member-' + this.model.get('peer_id')).length >0) {
      return $('#member-'+ this.model.get('peer_id')).prop('muted');
    } else if (isOwner !== undefined && isOwner === true) {
      if (this.model.get('is_owner')) {
        return true;
      }
    }
    return false;
  },
  setMute: function() {
    $('#modal-video-view').attr('muted','muted').prop('muted',true);
    $('#member-'+ this.model.get('peer_id')).attr('muted','muted').prop('muted',true);
    $('#mute-member-'+ this.model.get('peer_id')).removeClass('btn-info').addClass('btn-danger');
    $('#mute-member-'+ this.model.get('peer_id') + ' i').removeClass('fa-microphone').addClass('fa-microphone-slash');
  },
  setUnMute: function() {
    $('#modal-video-view').removeAttr('muted').prop('muted',false);
    $('#member-'+ this.model.get('peer_id')).removeAttr('muted').prop('muted',false);
    $('#mute-member-'+ this.model.get('peer_id')).removeClass('btn-danger').addClass('btn-info');
    $('#mute-member-'+ this.model.get('peer_id') + ' i').removeClass('fa-microphone-slash').addClass('fa-microphone');
  },
  toggleMute: function(e) {
    e.preventDefault();
    console.log('setMute video:' + $('#member-'+ this.model.get('peer_id')).prop('muted'));
    if (this.isMuted()) {
      this.setUnMute();
    } else {
      this.setMute();
    }
  },
  openModal: function(e) {
    e.preventDefault();
    // クリックしたVideoのモーダル表示を実施
    this.modal.attributes.modal_peer_id = this.model.get('peer_id');
    this.modal.attributes.modal_user_name = this.model.get('user_name');
    this.modal.attributes.modal_src = this.model.get('src');
    this.modal.attributes.modal_is_owner = this.model.get('is_owner');
    //console.log('renderModal',this.modal.attributes);

    // サムネイルのほうはいったんMute
    this.setMute();
    this.modal.trigger('open');
    return this;
  },
  closeModal: function(isMuted) {
    console.log('closeModal',isMuted);
    // モーダル側のMute状態をVideoList側へマージ
    isMuted?(this.setMute()):(this.setUnMute());
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
      '      <a href="#" id="mute-member-' + this.model.get('peer_id') + '" class="btn btn-block ' + (this.isMuted(true)?'btn-danger':'btn-info') +' btn-xs rtc-video-mute-on"><i class="fa fa-' + (this.isMuted(true)?'microphone-slash':'microphone') + '" ></i></a>' +
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
    this.tracker = args.tracker;

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

    // VideoList側へMute状態をマージ
    this.tracker.trigger('close_modal',this.attributes.modal_peer_id,$('#modal-video-view').prop('muted'));

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
      $('#modal-video-view').attr('muted','muted').prop('muted',true);
      $('.modal-video-mute').removeClass('btn-info').addClass('btn-danger');
      $('.modal-video-mute i').removeClass('fa-microphone').addClass('fa-microphone-slash');
    } else {
      $('#modal-video-view').removeAttr('muted').prop('muted',false);
      $('.modal-video-mute').removeClass('btn-danger').addClass('btn-info');
      $('.modal-video-mute i').removeClass('fa-microphone-slash').addClass('fa-microphone');
    }
  },
  setMute: function(e) {
    console.log('modal Mute',$('#modal-video-view').prop('muted'));
    e.preventDefault();
    if ($('#modal-video-view').prop('muted')) {
      $('#modal-video-view').removeAttr('muted').prop('muted',false);
      $('.modal-video-mute').removeClass('btn-danger').addClass('btn-info');
      $('.modal-video-mute i').removeClass('fa-microphone-slash').addClass('fa-microphone');
    } else {
      $('#modal-video-view').attr('muted','muted').prop('muted',true);
      $('.modal-video-mute').removeClass('btn-info').addClass('btn-danger');
      $('.modal-video-mute i').removeClass('fa-microphone').addClass('fa-microphone-slash');
    }
  },
  render: function() {
    return this;
  }
});
