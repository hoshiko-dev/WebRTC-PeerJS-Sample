# WebRTC-PeerJS-Sample
PeerJSを使ったWebRTCのサンプルアプリです。  
WebRTCの検証用に作成しました。

## 環境

* クライアント側peerjsは0.3.14です
* Signaling ServerにPeerJS-Server(0.2.8)が必要です
* ICEServerは任意ですが、 turnserverで確認しています


* ブラウザはChrome(Ver.44 32bit)で確認
* SPAなのでサーバサイドは不要です

## 初期設定

* 現状JavaScriptファイル(rtc-sample.js)を直接編修してください


|変数名|意味|備考|
|--------|---------|---------|
|width|表示するビデオサイズ(横)です。|カメラデバイスの性能やOSに依存します|
|height|表示するビデオサイズ(縦)です。|カメラデバイスの性能やOSに依存します|
|maxFrameRate|ビデオの最大フレームレートです|クライアントPCのCPU・メモリ、通信帯域に影響しいます|
|minFrameRate|ビデオの最少フレームレートです|クライアントPCのCPU・メモリ、通信帯域に影響しいます|
|rtcHost|PeerJS-ServerのIPアドレス||
|rtcPort|PeerJS-Serverのポート番号||
|config|STUN/TURNの設定です|※記載方法は検索のこと|
|debug|debugレベル|ブラウザのconsoleに表示するログレベルです|
|path|PeerJS-ServerへのHTTP通信のPATHを指定します|※必要な場合のみ|

## 画面・機能

### User Info(ユーザ情報画面)

* アプリのデフォルトページです
* 各ユーザのユーザ情報を登録する
* メモリ上に保存するだけなので、タブを閉じると消えます


### WebRTC View(WebRTC ビデオチャット画面)

* VIDEOサムネイル表示
  - 自身を含めたVideo情報をサムネイル表示します
  - 接続されたユーザー文表示
  - サムネイルをクリックするとポップアップで拡大表示します


* Chat機能
  - 接続したユーザ間でテキストチャットを行えます
  - チャットにはWebRTCのDataConnectionを使用


* PeerJS リソース取得・表示
  - PeerJS-ServerからPeerを接続中のリソースを取得します
  - 取得したリソースに対して接続・切断を行うことで、ビデオチャットが
    可能になります。


# その他

* ビデオチャットの接続はすべて手動なので、接続要求が輻輳した場合の
  制御は考慮してません
* backboneの勉強に、クライアントサイドにbackbone.js/jQueryを使用
* Chromeで切断した場合、相手側には切断まで15秒程度待ち時間が
  発生する模様(ChromeのVerに依存するかも)

# あったらいいかも

* muteのOnOff機能があるとよいかも。ただしFirefoxとChromeで動作を変更する必要があるはず
* ビデオチャットのメッシュ接続をオートでやる仕組みがあるとより実用的(ただし複雑)
