(function(window){
  window.Notification = {
    init: function(notificationMsgs, notificationPicPrefix){
      var oThis = this;

      Notification.Manager.getInstance().init(notificationMsgs, notificationPicPrefix);

      oThis.addDomListener();
    },

    addDomListener: function(){
      $(".profile-setting-icon").click(function(){
          $(".profile-setting-dropdown").toggleClass("open");
      })
    }
  }
})(window);