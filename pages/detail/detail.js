/*
 * 
 * WordPres版微信小程序
 * author: jianbo
 * organization: 守望轩  www.watch-life.net
 * github:    https://github.com/iamxjb/winxin-app-watch-life.net
 * 有问题加微信：poisonkid，不要叨扰jianbo
 * 开源协议：MIT
 *  *Copyright (c) 2017 https://www.watch-life.net All rights reserved.
 * 
 */

var INFO = wx.getSystemInfoSync();
const weToast = require('../../libs/weToast/weToast.js');
var toast;
import config from '../../utils/config.js'
var Api = require('../../utils/api.js');
var util = require('../../utils/util.js');
var auth = require('../../utils/auth.js');
var html2json = require('../../wxParse/html2json.js');
var WxParse = require('../../wxParse/wxParse.js');
var wxApi = require('../../utils/wxApi.js');
var wxRequest = require('../../utils/wxRequest.js');
import { ModalView } from '../../templates/modal-view/modal-view.js'
var signup = require('../../utils/auth.js');
var app = getApp();
let isFocusing = false
const pageCount = config.getPageCount;


Page({
  data: {
    skin: "../../images/pifu/2.png",
    opacity: 0,
    // 是否是点击分享进来的页面
    IS_SHARE_PAGE: false,
    SCROLL_TOP: 0,
    STATUSBAR_HEIGHT: INFO.statusBarHeight,
    title: '文章内容',
    detail: {},
    commentsList: [],
    ChildrenCommentsList: [],
    commentCount: '',
    detailDate: '',
    commentValue: '',
    wxParseData: {},
    display: 'none',
    page: 1,
    isLastPage: false,
    parentID: "0",
    focus: false,
    placeholder: "   说出你的想法...",
    postID: null,
    scrollHeight: 0,
    postList: [],
    link: '',
    dialog: {
      title: '',
      content: '',
      hidden: true
    },
    content: '',
    isShow: false, //控制menubox是否显示
    isLoad: true, //解决menubox执行一次  
    menuBackgroup: false,
    likeImag: "like.png",
    likeList: [],
    likeCount: 0,
    displayLike: 'none',
    replayTemplateId: config.getReplayTemplateId,
    userid: "",
    toFromId: "",
    commentdate: "",
    flag: 1,
    logo: config.getLogo,
    enableComment: true,
    isLoading: false,
    total_comments: 0,
    userInfo: app.globalData.userInfo,
    isLoginPopup: false

  },
  onLoad: function (options) {
    var that=this;
    this.setData({
      HEIGHT: wx.getSystemInfoSync().windowHeight,
      IS_SHARE_PAGE: getCurrentPages().length === 1
    });
    this.userAuthorization();

   // this.fetchDetailData(options.id);
    new ModalView;
    try {
      var res = wx.getStorageInfoSync()
      if (res.keys.indexOf('payCList') == -1 && res.keys.indexOf('payPList') == -1) {
        this.setData({
          isSync: true
        })
      }
    } catch (e) {
      // Do something when catch error
    }
    var id = options.id
    var scene = decodeURIComponent(options.scene)
    if (id) {
      this.fetchDetailData(id);
    } else {
      this.fetchDetailData(scene);
    }

    
    wx.login({
      success: res => {
       
        app.globalData.code = res.code
        //取出本地存储用户信息，解决需要每次进入小程序弹框获取用户信息
        app.globalData.userInfo = wx.getStorageSync('userInfo')
        //wx.getuserinfo接口不再支持
        wx.getSetting({
          success: (res) => {
            //判断用户已经授权。不需要弹框
            if (!res.authSetting['scope.userInfo']) {
              that.setData({
                showModel: true
              })
            } else {//没有授权需要弹框
              that.setData({
                showModel: false
              })
             
              //that.getOP(app.globalData.userInfo)
            }
          },
          fail: function () {
            wx.showToast({
              title: '系统提示:网络错误',
              icon: 'warn',
              duration: 1500,
            })
          }
        })



      }
    })
  },
  agreeGetUser: function (e) {
    var userInfo = e.detail.userInfo;
    var self = this;
    if (userInfo) {
      signup.getUsreInfo(e.detail);
      self.setData({
        userInfo: userInfo
      });
    }
    setTimeout(function () {
      self.setData({
        showModel: false,
        isLoginPopup: false
      })
    }, 1200);

  },
  closeLoginPopup() {
    this.setData({
      isLoginPopup: false
    });
  },
  openLoginPopup() {
    this.setData({
      isLoginPopup: true
    });
  },
  confirm: function () {
    this.setData({
      'dialog.hidden': true,
      'dialog.title': '',
      'dialog.content': ''
    })
  },
  userAuthorization: function (flag) {
    var self = this;
    // 判断是否是第一次授权，非第一次授权且授权失败则进行提醒
    wx.getSetting({
      success: function success(res) {
        console.log(res.authSetting);
        var authSetting = res.authSetting;
        if (!('scope.userInfo' in authSetting)) {
          //if (util.isEmptyObject(authSetting)) {
          console.log('第一次授权');
          if (flag == '1') {
            self.setData({
              isLoginPopup: true
            })
          }


        } else {
          console.log('不是第一次授权', authSetting);
          // 没有授权的提醒
          if (authSetting['scope.userInfo'] === false) {
            if (flag == '1') {
              wx.showModal({
                title: '用户未授权',
                content: '在授权管理中选中“用户信息”?',
                showCancel: true,
                cancelColor: '#296fd0',
                confirmColor: '#296fd0',
                confirmText: '设置权限',
                success: function (res) {
                  if (res.confirm) {
                    console.log('用户点击确定')
                    wx.openSetting({
                      success: function success(res) {
                        console.log('打开设置', res.authSetting);
                        var scopeUserInfo = res.authSetting["scope.userInfo"];
                        if (scopeUserInfo) {
                          signup.getUsreInfo(null);
                        }
                      }
                    });
                  }
                }
              })
            }

          } else {
            signup.getUsreInfo(null);

          }
        }
      }
    });
  },

  //收回动画
  scrollHandler: function (e) {
    var { scrollTop } = e.detail;
    // 计算透明度
    var opacity = parseFloat(scrollTop / 250).toFixed(2);
    if (opacity > 1) opacity = 1;
    if (opacity < 0.2) opacity = 0;
    // 这里设置<300是减少setData次数，节省内存
    if (scrollTop < 300) {
      this.setData({
        opacity
      })
    }
  },
  toTopHandler: function (e) {

    this.setData({
      SCROLL_TOP: 0
    })
  },
  goBackHandler: function () {
    wx.navigateBack({});
  },
  goHomeHandler: function () {
    wx.redirectTo({
      url: '/pages/index/index',
    })
  },
  // 下拉刷新
  onPullDownRefresh: function () {
    this.fetchDetailData(this.data.postID);
    wx.stopPullDownRefresh()
  },
  
  showImages: function (e) {
    console.log(e);
    var image = e.currentTarget.dataset.current;
    var list = e.currentTarget.dataset.list;

    wx.previewImage({
      current: image,
      urls: list,
    })


  },
  showLikeImg: function () {
    var self = this;
    var flag = false;
    var _likes = self.data.detail.avatarurls;
    var likes = [];
    for (var i = 0; i < _likes.length; i++) {
      var avatarurl = "../../images/gravatar.png";
      if (_likes[i].avatarurl.indexOf('wx.qlogo.cn') != -1) {
        avatarurl = _likes[i].avatarurl;
      }
      likes[i] = avatarurl;
    } 
    var temp = likes;
    self.setData({
      likeList: likes
    });
  },
  onReachBottom: function () {
    var self = this;
   

  }, 
  onShow: function () {
    var that = this;
    var skin = wx.getStorageSync('skin');
    if (skin != '') {
      that.setData({
        skin: skin
      })
    }

  },
  onShareAppMessage: function (res) {
    this.ShowHideMenu();
    console.log(res);
    return {
      title: '分享"' + config.getWebsiteName + '"的文章：' + this.data.detail.title.rendered,
      path: 'pages/detail/detail?id=' + this.data.detail.id,
      imageUrl: this.data.detail.post_thumbnail_image,
      success: function (res) {
        // 转发成功
        console.log(res);
      },
      fail: function (res) {
        console.log(res);
        // 转发失败
      }
    }
  },
  gotowebpage: function () {
    var self = this;
    self.ShowHideMenu();
    var minAppType = config.getMinAppType;
    var url = '';
    if (minAppType == "0") {
      url = '../webpage/webpage';
      wx.navigateTo({
        url: url + '?url=' + self.data.link
      })
    } else {
      self.copyLink(self.data.link);
    }

  },
  copyLink: function (url) {
    //this.ShowHideMenu();
    wx.setClipboardData({
      data: url,
      success: function (res) {
        wx.getClipboardData({
          success: function (res) {
            wx.showToast({
              title: '链接已复制',
              image: '../../images/link.png',
              duration: 2000
            })
          }
        })
      }
    })
  },
  clickLike: function (e) {
    var id = e.target.id;
    var self = this;
    if (id == 'likebottom') {
      this.ShowHideMenu();
    }

    if (app.globalData.isGetOpenid) {
      var data = {
        openid: app.globalData.openid,
        postid: self.data.postID
      };
      var url = Api.postLikeUrl();
      var postLikeRequest = wxRequest.postRequest(url, data);
      postLikeRequest
        .then(response => {
          if (response.data.status == '200') {
            var _likeList = []
            //var _like = { "avatarurl": app.globalData.userInfo.avatarUrl, "openid": app.globalData.openid }
            var _like = app.globalData.userInfo.avatarUrl;
            _likeList.push(_like);
            var tempLikeList = _likeList.concat(self.data.likeList);
            var _likeCount = parseInt(self.data.likeCount) + 1;
            self.setData({
              likeList: tempLikeList,
              likeCount: _likeCount,
              displayLike: 'block'
            });
            
           
            toast = new weToast(this);
            toast.success('谢谢点赞！');
          } else if (response.data.status == '501') {
            console.log(response.data.message);

            
            toast = new weToast(this);
            toast.info('您已经赞过了！');
          } else {
            console.log(response.data.message);

          }
          self.setData({
            likeImag: "like-on.png"
          });
        })
    } else {
      self.userAuthorization('1');
    }
  },
  getIslike: function () { //判断当前用户是否点赞
    var self = this;
    if (app.globalData.isGetOpenid) {
      var data = {
        openid: app.globalData.openid,
        postid: self.data.postID
      };
      var url = Api.postIsLikeUrl();
      var postIsLikeRequest = wxRequest.postRequest(url, data);
      postIsLikeRequest
        .then(response => {
          if (response.data.status == '200') {
            self.setData({
              likeImag: "like-on.png"
            });

            console.log("已赞过");
          }

        })

    }
  },

  goHome: function () {
    wx.switchTab({
      url: '../index/index'
    })
  },

  //获取文章内容
  fetchDetailData: function (id) {
    var self = this;
    var getPostDetailRequest = wxRequest.getRequest(Api.getPostByID(id));
    var res;
    var _displayLike = 'none';
    getPostDetailRequest
      .then(response => {
        res = response;
        WxParse.wxParse('article', 'html', response.data.content.rendered, self, 5);
        var nextimage = Api.getContentFirstImage(response.data.next_post_content);
        var previousimage = Api.getContentFirstImage(response.data.previous_post_content);
       
        var _likeCount = response.data.like_count;
        if (response.data.like_count != '0') {
          _displayLike = "block"
        }
        
        self.setData({
          detail: response.data,
          nextimage: nextimage,
          previousimage: previousimage,
          likeCount: _likeCount,
          postID: id,
          link: response.data.link,
          detailDate: util.cutstr(response.data.date, 10, 1),
          //wxParseData: WxParse('md',response.data.content.rendered)
          //wxParseData: WxParse.wxParse('article', 'html', response.data.content.rendered, self, 5),
          display: 'block',
          displayLike: _displayLike,
          

        });
        // 调用API从本地缓存中获取阅读记录并记录
        var logs = wx.getStorageSync('readLogs') || [];
        // 过滤重复值
        if (logs.length > 0) {
          logs = logs.filter(function (log) {
            return log[0] !== id;
          });
        }
        // 如果超过指定数量
        if (logs.length > 19) {
          logs.pop(); //去除最后一个
        }
        logs.unshift([id, response.data.title.rendered, response.data.post_thumbnail_image_624]);
        wx.setStorageSync('readLogs', logs);
        //end 

      })
      .then(response => {
        wx.setNavigationBarTitle({
          title: res.data.title.rendered
        });

      })
      .then(response => {
        var tagsArr = [];
        tagsArr = res.data.tags
        var tags = "";
        for (var i = 0; i < tagsArr.length; i++) {
          if (i == 0) {
            tags += tagsArr[i];
          } else {
            tags += "," + tagsArr[i];

          }
        }
        if (tags != "") {
          var getPostTagsRequest = wxRequest.getRequest(Api.getPostsByTags(id, tags));
          getPostTagsRequest
            .then(response => {
              self.setData({
                postList: response.data
              });

            })

        }
      }).then(response => {
        // var updatePageviewsRequest = wxRequest.getRequest(Api.updatePageviews(id));
        // updatePageviewsRequest
        //     .then(result => {
        //         console.log(result.data.message);

        //     })

      }).then(response => { //获取点赞记录
        self.showLikeImg();
      }).then(resonse => {
        if (!app.globalData.isGetOpenid) {
          self.userAuthorization('0');
        }

      }).then(response => { //获取是否已经点赞
        if (app.globalData.isGetOpenid) {
          self.getIslike();
        }
      })
      .catch(function (response) {

      })
    // .finally(function (response) {

    // });


  },
  //给a标签添加跳转和复制链接事件
  wxParseTagATap: function (e) {
    var self = this;
    var href = e.currentTarget.dataset.src;
    console.log(href);
    var domain = config.getDomain;
    //可以在这里进行一些路由处理
    if (href.indexOf(domain) == -1) {
      wx.setClipboardData({
        data: href,
        success: function (res) {
          wx.getClipboardData({
            success: function (res) {
              wx.showToast({
                title: '链接已复制',
                //icon: 'success',
                image: '../../images/link.png',
                duration: 2000
              })
            }
          })
        }
      })
    } else {
      var slug = util.GetUrlFileName(href, domain);
      if (slug == 'index') {
        wx.switchTab({
          url: '../index/index'
        })
      } else {
        var getPostSlugRequest = wxRequest.getRequest(Api.getPostBySlug(slug));
        getPostSlugRequest
          .then(res => {
            if (res.statusCode == 200) {
              if (res.data.length != 0) {
                var postID = res.data[0].id;
                var openLinkCount = wx.getStorageSync('openLinkCount') || 0;
                if (openLinkCount > 4) {
                  wx.redirectTo({
                    url: '../detail/detail?id=' + postID
                  })
                } else {
                  wx.navigateTo({
                    url: '../detail/detail?id=' + postID
                  })
                  openLinkCount++;
                  wx.setStorageSync('openLinkCount', openLinkCount);
                }
              } else {
                var minAppType = config.getMinAppType;
                var url = '../webpage/webpage'
                if (minAppType == "0") {
                  url = '../webpage/webpage';
                  wx.navigateTo({
                    url: url + '?url=' + href
                  })
                } else {
                  self.copyLink(href);
                }


              }

            }

          }).catch(res => {
            console.log(response.data.message);
          })
      }
    }

  },

  //显示或隐藏功能菜单
  ShowHideMenu: function () {
    this.setData({
      isShow: !this.data.isShow,
      isLoad: false,
      menuBackgroup: !this.data.false
    })
  },
  //点击非评论区隐藏功能菜单
  hiddenMenubox: function () {
    this.setData({
      isShow: false,
      menuBackgroup: false
    })
  },
  //底部刷新
  loadMore: function (e) {
    var self = this;
  
  },
   getUsreInfo: function () {
    var self = this;
    var wxLogin = wxApi.wxLogin();
    var jscode = '';
    wxLogin().then(response => {
      jscode = response.code
      var wxGetUserInfo = wxApi.wxGetUserInfo()
      return wxGetUserInfo()
    }).then(response => {
      console.log(response.userInfo);
      console.log("成功获取用户信息(公开信息)");
      app.globalData.userInfo = response.userInfo;
      app.globalData.isGetUserInfo = true;
      self.setData({
        userInfo: response.userInfo
      });

      var url = Api.getOpenidUrl();
      var data = {
        js_code: jscode,
        encryptedData: response.encryptedData,
        iv: response.iv,
        avatarUrl: response.userInfo.avatarUrl
      }
      var postOpenidRequest = wxRequest.postRequest(url, data);
      //获取openid
      postOpenidRequest.then(response => {
        if (response.data.status == '200') {
          //console.log(response.data.openid)
          console.log("openid 获取成功");

          app.globalData.openid = response.data.openid;
          self.getuserid(response.data.openid);
          app.globalData.isGetOpenid = true;
        }
        else {
          console.log(response.data.message);
        }
      })
    }).catch(function (error) {
      console.log('error: ' + error.errMsg);
      self.userAuthorization();
    })
  },
  userAuthorization: function (flag) {
    var self = this;
    // 判断是否是第一次授权，非第一次授权且授权失败则进行提醒
    wx.getSetting({
      success: function success(res) {
        console.log(res.authSetting);
        var authSetting = res.authSetting;
        if (!('scope.userInfo' in authSetting)) {
          //if (util.isEmptyObject(authSetting)) {
          console.log('第一次授权');
          if (flag == '1') {
            self.setData({
              isLoginPopup: true
            })
          }


        } else {
          console.log('不是第一次授权', authSetting);
          // 没有授权的提醒
          if (authSetting['scope.userInfo'] === false) {
            if (flag == '1') {
              wx.showModal({
                title: '用户未授权',
                content: '在授权管理中选中“用户信息”?',
                showCancel: true,
                cancelColor: '#296fd0',
                confirmColor: '#296fd0',
                confirmText: '设置权限',
                success: function (res) {
                  if (res.confirm) {
                    console.log('用户点击确定')
                    wx.openSetting({
                      success: function success(res) {
                        console.log('打开设置', res.authSetting);
                        var scopeUserInfo = res.authSetting["scope.userInfo"];
                        if (scopeUserInfo) {
                          auth.getUsreInfo(null);
                        }
                      }
                    });
                  }
                }
              })
            }

          } else {
            auth.getUsreInfo(null);
        


          }
        }
      }
    });
  },
 
  downimageTolocal: function () {
    var self = this;
    self.ShowHideMenu();
    // wx.showLoading({
    //title: "正在生成海报",
    //mask: true,
    // });
    var postid = self.data.detail.id;
    var title = self.data.detail.title.rendered;
    var path = "pages/detail/detail?id=" + postid;
    var excerpt = util.removeHTML(self.data.detail.content.rendered);
    var postImageUrl = "";
    var posterImagePath = "";
    var qrcodeImagePath = "";
    var flag = false;
    var imageInlocalFlag = false;
    var domain = config.getDomain;
    var downloadFileDomain = config.getDownloadFileDomain;

    var fristImage = self.data.detail.content_first_image;

    //获取文章首图临时地址，若没有就用默认的图片,如果图片不是request域名，使用本地图片
    if (fristImage) {
      var n = 0;
      for (var i = 0; i < downloadFileDomain.length; i++) {

        if (fristImage.indexOf(downloadFileDomain[i].domain) != -1) {
          n++;
          break;
        }
      }
      if (n > 0) {
        imageInlocalFlag = false;
        postImageUrl = fristImage;

      }
      else {
        postImageUrl = config.getPostImageUrl;
        posterImagePath = postImageUrl;
        imageInlocalFlag = true;
      }

    }
    else {
      postImageUrl = config.getPostImageUrl;
      posterImagePath = postImageUrl;
      imageInlocalFlag = true;
    }

    console.log(postImageUrl);
    if (app.globalData.isGetOpenid) {
      var openid = app.globalData.openid;
      var data = {
        postid: postid,
        path: path,
        openid: openid
      };

      var url = Api.creatPoster();
      var qrcodeUrl = "";
      var posterQrcodeUrl = Api.getPosterQrcodeUrl() + "qrcode-" + postid + ".png";
      //生成二维码
      var creatPosterRequest = wxRequest.postRequest(url, data);
      creatPosterRequest.then(response => {
        if (response.statusCode == 200) {
          if (response.data.status == '200') {
            const downloadTaskQrcodeImage = wx.downloadFile({
              url: posterQrcodeUrl,
              success: res => {
                if (res.statusCode === 200) {
                  qrcodeImagePath = res.tempFilePath;
                  console.log("二维码图片本地位置：" + res.tempFilePath);
                  if (!imageInlocalFlag) {
                    const downloadTaskForPostImage = wx.downloadFile({
                      url: postImageUrl,
                      success: res => {
                        if (res.statusCode === 200) {
                          posterImagePath = res.tempFilePath;
                          console.log("文章图片本地位置：" + res.tempFilePath);
                          flag = true;
                          if (posterImagePath && qrcodeImagePath) {
                            self.createPosterLocal(posterImagePath, qrcodeImagePath, title, excerpt);
                          }
                        }
                        else {
                          console.log(res);
                          wx.hideLoading();
                          wx.showToast({
                            title: "生成海报失败...",
                            mask: true,
                            duration: 2000
                          });
                          return false;


                        }
                      }
                    });
                    downloadTaskForPostImage.onProgressUpdate((res) => {
                      console.log('下载文章图片进度：' + res.progress)

                    })
                  }
                  else {
                    if (posterImagePath && qrcodeImagePath) {
                      self.createPosterLocal(posterImagePath, qrcodeImagePath, title, excerpt);
                    }
                  }
                }
                else {
                  console.log(res);
                  //wx.hideLoading();
                  flag = false;
                  wx.showToast({
                    title: "生成海报失败...",
                    mask: true,
                    duration: 2000
                  });
                  return false;
                }
              }
            });
            downloadTaskQrcodeImage.onProgressUpdate((res) => {
              console.log('下载二维码进度', res.progress)
            })
          }
          else {
            console.log(response);
            //wx.hideLoading();
            flag = false;
            wx.showToast({
              title: "生成海报失败...",
              mask: true,
              duration: 2000
            });
            return false;
          }
        }
        else {
          console.log(response);
          //wx.hideLoading();
          flag = false;
          wx.showToast({
            title: "生成海报失败...",
            mask: true,
            duration: 2000
          });
          return false;
        }

      });
    }

  },
  //将canvas转换为图片保存到本地，然后将路径传给image图片的src
  createPosterLocal: function (postImageLocal, qrcodeLoal, title, excerpt) {
    var that = this;
    wx.showLoading({
      title: "正在生成海报",
      mask: true,
    });
    var context = wx.createCanvasContext('mycanvas');
    //context.setFillStyle('#fff');//填充背景色
    context.fillRect(0, 0, 600, 970);
    //context.drawImage(qrcodeLoal, 95, 700, 180, 180);//绘制二维码
    context.drawImage(that.data.logo, 0, 0, 600, 970);//画logo
    context.drawImage(postImageLocal, 72,190,460, 270);//绘制首图
    context.drawImage(qrcodeLoal, 95, 710, 160, 160);//绘制二维码
    //context.drawImage(that.data.userInfo.avatarUrl, 220, 870, 30, 30);//绘制二维码
    //const grd = context.createLinearGradient(30, 690, 570, 690)//定义一个线性渐变的颜色
    //grd.addColorStop(0, 'black')
    //grd.addColorStop(1, '#ffd900')
    //context.setFillStyle(grd)
    context.setFillStyle("#000000");
    context.setFontSize(20);
    context.setTextAlign('left');
    //context.fillText('@'+that.data.userInfo.nickName, 300, 900);
    context.fillText("长按识别二维码", 300, 770);
    context.fillText("查看完整文章", 300, 810);
    //context.setStrokeStyle(grd)
   // context.setFillStyle("#000000");
    //context.beginPath()//分割线
    //context.moveTo(30, 690)
    //  context.lineTo(570, 690)
    context.stroke();
    // this.setUserInfo(context);//用户信息   
    util.drawTitleExcerpt(context, title, excerpt);//文章标题
    context.draw();
    //将生成好的图片保存到本地，需要延迟一会，绘制期间耗时
    setTimeout(function () {
      wx.canvasToTempFilePath({
        canvasId: 'mycanvas',
        success: function (res) {
          var tempFilePath = res.tempFilePath;
          // that.setData({
          //imagePath: tempFilePath,
          //maskHidden: "none"
          // });
          wx.hideLoading();
          console.log("海报图片路径：" + res.tempFilePath);
          that.modalView.showModal({
            title: '海报将保存到本地相册',
            confirmation: false,
            confirmationText: '',
            inputFields: [{
              fieldName: 'posterImage',
              fieldType: 'Image',
              fieldPlaceHolder: '',
              fieldDatasource: res.tempFilePath,
              isRequired: false,
            }],
            confirm: function (res) {
              console.log(res)
              //用户按确定按钮以后会回到这里，并且对输入的表单数据会带回
            }
          })


        },
        fail: function (res) {
          console.log(res);
        }
      });
    }, 900);
  },
  creatPoster: function () {

    /////////////////
    var self = this;
    self.ShowHideMenu();
    if (self.data.posterImageUrl) {
      url = '../poster/poster?posterImageUrl=' + posterImageUrl;
      wx.navigateTo({
        url: url
      })
      return true;
    }
    var postid = self.data.detail.id;
    var title = self.data.detail.title.rendered;
    var path = "pages/detail/detail?id=" + postid;
    var postImageUrl = "";
    if (self.data.detail.content_first_image) {
      postImageUrl = self.data.detail.content_first_image;
    }
    wx.showLoading({
      title: "正在生成图片",
      mask: false,
    });

    if (app.globalData.isGetOpenid) {
      var openid = app.globalData.openid;
      var data = {
        postid: postid,
        title: title,
        path: path,
        postImageUrl: postImageUrl,
       openid: openid
      };
      var url = Api.creatPoster();
      var posterImageUrl = Api.getPosterUrl() + "poster-" + postid + ".jpg";
      var creatPosterRequest = wxRequest.postRequest(url, data);
      creatPosterRequest.then(response => {
        if (response.statusCode == 200) {
          if (response.data.status == '200') {
            url = '../poster/poster?posterImageUrl=' + posterImageUrl;
            wx.navigateTo({
              url: url
            })

          } else {
            console.log(response);

          }
        }
        else {
          console.log(response);
        }

      }).catch(response => {
        console.log(response);
      }).finally(function (response) {
        wx.hideLoading();
      });

    }

    ////////

  }

})