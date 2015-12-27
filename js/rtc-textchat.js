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
    var text = $('#text-chat').val();
    console.log('postTextChat text:',text);
    if (!_.isEmpty(text)) {
      this.model.tracker.sendTextChat(text);
    }
  },
  onRecieveChat: function(chat) {
    // テキストチャットを追加
    console.log(chat,'onRecieveChat');
    if (!_.isEmpty(chat)) {
      var chatModel = new ChatModel({'text': chat['text'],'user_name': chat['user_name'],'post_date': chat['post_date']});
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
  render: function() {
    this.$el.append(
      '<td class="chat-date">' + this.model.get('post_date') + '</td>'
      + '<td class="chat-name">' + this.model.get('user_name') + '</td>'
      + '<td>' + this.model.get('text').replace(/\n/g, '<br>') + '</td>'
    );
    return this;
  },
});
