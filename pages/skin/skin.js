// pages/skin/skin.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    skin: "../../images/pifu/2.png",
    skinList: [{
        title: "天空蓝",
      color: " #22aaff",
        imgUrl: "../../images/pifu/1.png"
      },
      {
        title: "樱草黄",
        color: " #ffd200",
        imgUrl: "../../images/pifu/2.png"
      },
      {
        title: "珊瑚朱",
        color: " #f17c67",
        imgUrl: "../../images/pifu/3.png"
      },


      {
        title: "霓虹绿",
        color: " #f17c67",
        imgUrl: "../../images/pifu/4.png"
      },


      {
        title: "青瓷色",
        color: " #ACE1AF",
        imgUrl: "../../images/pifu/5.png"
      },


      {
        title: "木炭灰",
        color: " #404040",
        imgUrl: "../../images/pifu/6.png"
      },


      {
        title: "金盏花",
        color: " #F5AB00",
        imgUrl: "../../images/pifu/7.png"
      },



    ],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

  },
  goHomeHandler: function () {
    wx.redirectTo({
      url: '/pages/index/index',
    })
  },
  chooseSkin: function(e) {
    var image = e.currentTarget.dataset.url;
    if (image) {
      wx.setStorageSync('skin', image)
    }
    wx.navigateBack({

    })

  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    var that = this;
    var skin = wx.getStorageSync('skin');
    if (skin != '') {
      that.setData({
        skin: skin
      })
    }

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})