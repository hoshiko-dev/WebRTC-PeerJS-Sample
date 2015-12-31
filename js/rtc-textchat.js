'use strict';

var ChatModel = Backbone.Model.extend({

  defaults: {
    text: '',
    user_name: ''
  },

  initialize: function (args) {
    // super
  }

});
// RTC Viedeo List View
var RtcTextChatView = Backbone.View.extend({
  el: "#rtc-text-chat-area",
  initialize: function (args) {
    // super
    this.render();
    this.listenTo(this.collection,'recieve_chat',this.onRecieveChat.bind(this));
  },
  events: {
    'click #post-text-chat': 'postTextChat',
  },
  postTextChat: function(e){
    e.preventDefault();
    console.log('postTextChat');
    var text = $('#text-chat').val();
    if (!_.isEmpty(text)) {
      // 対象全員に送信
      this.collection.each(function(member){
        if (!member.get('is_owner')) {

          var chat = {
            event_name: 'send_chat_text',
            info : {
              text: text,
              user_name: this.model.you.get('user_name')
            }
          }
          librtc.sendData(member.get('rtc_data'),chat);
        } else {
          var chat = {
            text: text,
            user_name: this.model.you.get('user_name')
          }
          this.onRecieveChat(chat);
        }
      },this);
    }
  },
  onRecieveChat: function(chat) {
    // テキストチャットを追加
    console.log(chat,'onRecieveChat');
    if (!_.isEmpty(chat)) {
      var chatModel = new ChatModel({text: chat['text'],user_name: chat['user_name']});
      var newRecord = new RtcTextChatRecordView({model: chatModel});
      this.$el.find('#text-chat-table').append(newRecord.render().el);

      var obj = $("#chat-block-wrap");
      if(obj.length) {
        obj.scrollTop(obj[0].scrollHeight - obj.height());
      }
    }
    $('#text-chat').val('');
  },
  render: function(){
    this.$el.show();
    return this;
  }
});


// Videoタグ情報VIEW
var RtcTextChatRecordView = Backbone.View.extend({
  tagName: 'tr',
  className: 'chat-text',
  initialize: function (args) {
    // super
  },
  getNowDate: function() {
    var date = new Date();
    return ([date.getFullYear(), date.getMonth() + 1, date.getDate()].join('/') + ' ' + date.toLocaleTimeString());
  },
  render: function() {
    this.$el.append(
      '<td class="chat-date">' + this.getNowDate() + '</td>'
      + '<td class="chat-name">' + this.model.get('user_name') + '</td>'
      + '<td>' + this.model.get('text').replace(/\n/g, '<br>') + '</td>'
    );
    return this;
  },
});
