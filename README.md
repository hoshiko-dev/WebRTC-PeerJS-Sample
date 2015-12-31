# WebRTC-PeerJS-Sample
PeerJSを使ったWebRTCのサンプルアプリです。  
WebRTCの検証用に作成しました。

## 環境

* クライアント側peerjsは0.3.14です
* Signaling ServerにPeerJS-Server(0.2.8)が必要です
* ICEServerは任意ですが、 turnserverで確認しています


* ブラウザはChrome(Ver.47 PC 32bit/Android5.0/6.0)で確認
* ES2015の機能を一部使っているため、chrome以外では動かないかもしれません。
* 2015年以降、Chrome上でのWebRTCの利用にはSSL証明書が必須となりそうです。最低限httpサーバ/peerjsには必須です。(peerjsの構成を考えるとオレオレ証明書だけは不可だと思います。)
 - Windows版Chromeは猶予期間。Android5.0以降のChromeではSSL証明書が必須となっています(2015/12確認)


## 初期設定

* 現状JavaScriptファイル(rtc-sample.js)を直接編修してください


|変数名|意味|備考|
|--------|---------|---------|
|appPath|Webサーバで表示する際、パスを指定している場合は入力してください||
|width|表示するビデオサイズ(横)です。|カメラデバイスの性能やOSに依存します|
|height|表示するビデオサイズ(縦)です。|カメラデバイスの性能やOSに依存します|
|maxFrameRate|ビデオの最大フレームレートです|クライアントPCのCPU・メモリ、通信帯域に影響しいます|
|minFrameRate|ビデオの最少フレームレートです|クライアントPCのCPU・メモリ、通信帯域に影響しいます|
|rtcHost|PeerJS-ServerのIPアドレス||
|rtcPort|PeerJS-Serverのポート番号||
|config|STUN/TURNの設定です|※記載方法は検索のこと|
|debug|debugレベル|ブラウザのconsoleに表示するログレベルです|
|path|PeerJS-ServerへのHTTP通信のPATHを指定します|※必要な場合のみ|
|frame_rates|カメラのフレームレートをUser Infoから選択できるようにしました。種類を増やす場合は編集してください。||
|video_sizes|カメラの解像度をUser Infoから選択できるようにしました。種類を増やす場合は編集してください。||


## 画面・機能

### User Info(ユーザ情報画面)

* アプリのデフォルトページです
* 各ユーザのユーザ情報を登録する
* デバイスに複数のカメラが選択されている場合は指定可能です
* 映像のフレームレート、解像度を指定する
* メモリ上に保存するだけなので、タブを閉じると消えます

### WebRTC View(WebRTC ビデオチャット画面)

* VIDEOサムネイル表示
  - 自身を含めたVideo情報をサムネイル表示します
  - 接続されたユーザー文表示
  - サムネイルをクリックするとポップアップで拡大表示します
  - muteボタンでmute/unmuteができます。自分自身はmute状態を維持してください。
  - サムネイル上で最大化表示、mute/unmuteボタンを使うことができます。

* Chat機能
  - 接続したユーザ間でテキストチャットを行えます
  - チャットにはWebRTCのDataConnectionを使用

* PeerJS リソース取得・表示
  - PeerJS-ServerからPeerを接続中のリソースを取得します
  - 取得したリソースに対して接続・切断を行うことで、ビデオチャットが
    可能になります。

### Camera Test(Webカメラのテスト機能)

* 接続されているWebカメラの解像度をテストし、OK/NGを返します。
* 解像度のパターンはrtc-samplesに記載されている解像度すべてになります。
* 判定はAPI:getUserMediaを使った接続可否で行っていますが、Chromeでの判定が一部怪しいところがあり、NGとなってもWebRTC Viewで使うとつながる場合があります。Chromeの不具合の可能性もあります。(2015/12)
* Camera Testから選択した解像度は、User Info/WebRTC Viewにも反映されます。

# その他

* ビデオチャットの接続はすべて手動なので、接続要求が輻輳した場合の
  制御は考慮してません
* backboneの勉強に、クライアントサイドにbackbone.js/jQuery/bootstrap3を使用


# あったらいいかも(未実装)

* デスクトップキャプチャ機能連携
* マルチチャネル機能
* ハウリング対策(HTML5のaudio機能連携)
* ビデオチャットのメッシュ接続をオートでやる仕組みがあるとより実用的(ただし複雑)
