'use strict';

// RTC Viedeo List View
var RtcVideoListView = Backbone.View.extend({
  el: "#video-thumbnails",
  initialize: function (args) {
    // super
    this.listenTo(this.collection,'add',this.addVideo);
    this.listenTo(this.collection,'create_call',this.addOtherVideo);
    this.listenTo(this.collection,'send_profile',this.sendProfile);
    this.listenTo(this.model.you,'recieve_call',this.onRecieveCall);
    this.listenTo(this.model.you,'recieve_data',this.onRecieveData);
    this.render();
  },
  addVideo: function(member){
    console.log('addVideo');
    if (member.get('rtc_media') || member.get('is_owner')) {
      var newVideo = new RtcVideoTagView({model: member});
      this.$el.append(newVideo.render().el);
    }
  },
  addOtherVideo: function(member){
    console.log('addOtherVideo');
    var newVideo = new RtcVideoTagView({model: member});
    this.$el.append(newVideo.render().el);
  },
  onRecieveCall: function(media) {
    // 対向からのビデオチャット通知受信部
    console.log('test onRecieveCall:',media.peer);
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
        this.addVideo(targetUser);
        return false;
      }
    },this);
    if (!isAlready) {
      console.log('new');
      // 新規Peer検出
      targetUser = new User({peer_id: media.peer,rtc_media: media});
      this.collection.add(targetUser);
    }
    // VIDEOタグ自体は次のonStreamでやれる
    if (targetUser) {
      targetUser.setMediaEvent();
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
      targetUser = new User({peer_id: data.peer,rtc_data: data});
      this.collection.add(targetUser);
    }
    if (targetUser) {
      targetUser.setDataEvent();
    }
  },
  sendProfile: function(target) {
    // 対向にあなたの情報を送信
    var targetDataCon = target.get('rtc_data');
    var profile = {
      event_name: 'send_profile',
      info : {
        user_name: this.model.you.get('user_name'),
        email: this.model.you.get('email')
      }
    }
    librtc.sendData(targetDataCon,profile);
  },
  render: function(){
    $('#user-form').hide();
    $('#rtc-view').show();
  }
});


// Videoタグ情報VIEW
var RtcVideoTagView = Backbone.View.extend({
  tagName: 'div',
  className: 'col-sm-6 col-md-3',
  initialize: function (args) {
    // super
    // TODO:差分差し替えのほうがよい
    this.listenTo(this.model,'change',this.render);
    this.listenTo(this.model,'remove_video',this.destory);
  },
  events: {
    'click .rtc-video-modal-on': 'renderModal',
  },
  destory: function() {
    this.$el.remove();
  },
  renderModal: function() {
    // クリックしたVideoのモーダル表示を実施
    console.log('renderModal');
    $('#modal-video-title').text('User Name: ' + this.model.get('user_name'));
    $('#modal-video-view').attr('src',this.model.get('src'));
    $('#modal-video-view').addClass('video-size-modal');
    if (this.model.get('is_owner')) {
      $('#modal-video-view').attr('muted','muted');
    } else {
      $('#modal-video-view').removeAttr('muted');
      // サムネイルのほうはいったんMute
      $('#member-'+ this.model.get('peer_id')).attr('muted','muted');
    }
  },
  render: function() {
    console.log('video tag render');
    this.$el.children().remove();
    this.$el.append(
      '  <div class="thumbnail">' +
      '    <a data-toggle="modal" href="#myModal" class="rtc-video-modal-on">' +
      '      <video id="member-' + this.model.get('peer_id') + '" src="' + this.model.get('src') + '" class="video-size-minimal" autoplay ' + (this.model.get('is_owner')?" muted":"") + '></video>' +
      '     </a>' +
      '    <div class="caption pt0">' +
      '      <h6 class="caption-user-name ' +
      (this.model.get('is_owner')?'bg-primary':'bg-success') +
      ' mt0">Name:' + this.model.get('user_name') + '</h6>' +
      '      <h6 class="caption-memo">Peer-ID:' + this.model.get('peer_id') + '</h6>' +
      '    </div>' +
      '  </div>'
    );
    return this;
  }
});
