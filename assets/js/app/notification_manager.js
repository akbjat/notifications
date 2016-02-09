(function (Notification) {

  var notificationManager = null;

  var AJAX_TIMER = 5000;

  var NotificationManager = function () {
    this.notificationStore = {};
    this.unReadMsgIds = [];
  };


  var proto = {
    jMsgCounter: $(".notification-counter"),
    jNotificationContainer: $("#notification-content"),
    jNotificationWrapper: $("#notification-wrapper"),
    notificationStore: null,
    notificationPicPrefix: "",
    unReadMsgIds: null,
    maxMsgIdInStore: 0,
    ajaxTimer: null,
    ajaxUrl: "/pullNotificationMsg",

    init: function (notificationMsgs, notificationPicPrefix) {
      var oThis = this;
      oThis.notificationPicPrefix = notificationPicPrefix;
      oThis.addNotificationMsgs(notificationMsgs);
      oThis.startMsgPulling();
      oThis.addEventListener();
    },

    addEventListener: function () {
      var oThis = this;
      $(".notification-header-icon").click(function ( event ) {
        var jNotificationWrapper = oThis.jNotificationWrapper;
        if (jNotificationWrapper.hasClass("open")) {
          jNotificationWrapper.removeClass("open");
        } else {
          jNotificationWrapper.addClass("open");
          oThis.markMsgsRead();
        }
        $("#notification-wrapper").animate({
          height: "toggle"
        }, 500);

        event.stopPropagation();


      });
      $("body").click(function ( event ) {
        var jNotificationWrapper = oThis.jNotificationWrapper;
        
        if( jNotificationWrapper.hasClass("open") && $( event.target ).parents( "#notification-wrapper" ).length == 0 )  {

          jNotificationWrapper.removeClass("open");
            $("#notification-wrapper").animate({
            height: "toggle"
          }, 500);
        }
      });
    },

    addNotificationMsgs: function (notificationMsgs) {
      var oThis = this,
        jNotificationWrapper = oThis.jNotificationWrapper,
        newMsgToAppendInView = oThis.addMsgToStore(notificationMsgs);
      if (jNotificationWrapper.hasClass("open")) {
        oThis.markMsgsRead();
      }
      oThis.updateView(newMsgToAppendInView);

    },

    addMsgToStore: function (notificationMsgs) {
      var oThis = this,
        notificationStore = oThis.notificationStore,
        newAddedMsgs = [],
        maxMsgIdInStore = oThis.maxMsgIdInStore,
        localStorageData = JSON.parse( localStorage.getItem('notificationMsgs') ) || [];

      _.each(notificationMsgs, function (notificationMsg) {
        if (notificationStore.hasOwnProperty(notificationMsg.msg_id)) {
          return;
        }

        localStorageData.push( notificationMsg );

        notificationStore[notificationMsg.msg_id] = notificationMsg;
        newAddedMsgs.push(notificationMsg);
        var msgId = notificationMsg.msg_id;
        if (maxMsgIdInStore < msgId) {
          maxMsgIdInStore = msgId;
        }
        if (notificationMsg.is_read == 0) {
          oThis.unReadMsgIds.push(msgId);
        }
      });

      //-----adding in local storage------//

        localStorage.setItem("notificationMsgs", JSON.stringify(localStorageData) );
      //----------------------------------//


      oThis.maxMsgIdInStore = maxMsgIdInStore;
      return newAddedMsgs;
    },

    getUnreadCount: function () {
      return this.unReadMsgIds.length;
    },

    removeMsgIdFromUnreadMsgIds: function (readMsgIds) {
      var oThis = this;
      oThis.unReadMsgIds = _.difference(oThis.unReadMsgIds, readMsgIds);
      oThis.updateMsgCounter();
    },

    markMsgsRead: function () {
      var oThis = this,
        unReadMsgIds = oThis.unReadMsgIds,
        localStorageData = JSON.parse( localStorage.getItem('notificationMsgs') ) || [];


      if (unReadMsgIds.length > 0) {
        var formData = {
          "msgIds": unReadMsgIds
        };

         _.each(localStorageData, function (notificationMsg) {

             if( unReadMsgIds.indexOf( notificationMsg.msg_id ) != -1 ){
              notificationMsg.is_read = 1;
             }

         });
         localStorage.setItem("notificationMsgs", JSON.stringify(localStorageData) );

        /*
        $.ajax({
          type: 'POST',
          url: "/readNotificationMsg",
          data: JSON.stringify(formData),
          dataType: 'json',
          contentType: 'application/json'
        }).done(function (res) {
        });
        */
      }
      oThis.removeMsgIdFromUnreadMsgIds(unReadMsgIds);

    },

    updateView: function (msgToAppendInView) {
      var oThis = this;

      oThis.updateMsgCounter();
      oThis.prependMsgsToNotificationContainer(msgToAppendInView);
    },

    updateMsgCounter: function () {
      var oThis = this;
      oThis.jMsgCounter.html(oThis.getUnreadCount());

    },

    prependMsgsToNotificationContainer: function (msgToAppendInView) {
      var oThis = this,
        jNotificationContainer = oThis.jNotificationContainer,
        template = $("#notificationMsgContent").html(),
        imgPrefix = oThis.notificationPicPrefix,
        htmlToPrepend = "";

      msgToAppendInView = msgToAppendInView.sort(function (msg1, msg2) {
        return msg1.msg_id - msg2.msg_id;
      });

      _.each(msgToAppendInView, function (msg) {
        htmlToPrepend = Mustache.to_html(template, {
            pic_prefix: imgPrefix,
            pic: msg.pic,
            user_name: msg.user_name,
            msg: msg.msg
          }) + htmlToPrepend;
      });

      jNotificationContainer.prepend(htmlToPrepend);
    },

    startMsgPulling: function () {
      var oThis = this;
        oThis.startAjaxPulling();
    },

    startAjaxPulling: function () {
      var oThis = this;
      oThis.ajaxTimer = setInterval($.proxy(oThis.getNotificationMsgThroughAjax, oThis), AJAX_TIMER);
    },

    stopAjaxPulling: function () {
      clearInterval(this.ajaxTimer);
    },

    getNotificationMsgThroughAjax: function () {
      var oThis = this,
        maxMsgIdInStore = oThis.maxMsgIdInStore;

      var formData = {
        "maxMsgIdInStore": maxMsgIdInStore
      };

      /*--------------------------------Mock data---------------------------*/
      var notificationMsgs =  [
          {"msg_id":maxMsgIdInStore + 1,"msg":"posted a photo on your wall","is_read":0,"user_name":"John Doe","pic":"3_3.jpg"},
          {"msg_id":maxMsgIdInStore + 1,"msg":"commented on your last video","is_read":0,"user_name":"Greg Lucas","pic":"1_greg.jpg"},
          {"msg_id":maxMsgIdInStore + 1,"msg":"liked your photo","is_read":0,"user_name":"John Doe","pic":"3_3.jpg"},
          {"msg_id":maxMsgIdInStore + 1,"msg":"commented on your video","is_read":0,"user_name":"Greg Lucas","pic":"1_greg.jpg"},
          {"msg_id":maxMsgIdInStore + 1,"msg":"has made a new friend","is_read":0,"user_name":"John Doe","pic":"3_3.jpg"},
          {"msg_id":maxMsgIdInStore + 1,"msg":"posted a photo on your wall","is_read":0,"user_name":"John Doe","pic":"3_3.jpg"},
          {"msg_id":maxMsgIdInStore + 1,"msg":"shared a memory","is_read":0,"user_name":"Jane Doe","pic":"2_2.jpg"},
          {"msg_id":maxMsgIdInStore + 1,"msg":"liked your photo","is_read":0,"user_name":"Jane Doe","pic":"2_2.jpg"},
          {"msg_id":maxMsgIdInStore + 1,"msg":"commented on your video","is_read":0,"user_name":"Jane Doe","pic":"2_2.jpg"},
          {"msg_id":maxMsgIdInStore + 1,"msg":"commented on your last video","is_read":0,"user_name":"Jane Doe","pic":"2_2.jpg"}
        ];
      var newNotificationMsgs =  [],
          randomIndex         =  Math.floor( Math.random() * 10 );

      if( notificationMsgs[ randomIndex ] ){
        newNotificationMsgs.push( notificationMsgs[ randomIndex ] )
      }
      oThis.addNotificationMsgs( newNotificationMsgs );

      /*----------------------------------------------------------------------*/

      /*-----------------------------------Ajax call -------------------------*/
      /*
      ---- the below code sends an ajax call to get the data
      $.ajax({
        type: 'POST',
        url: oThis.ajaxUrl,
        data: JSON.stringify(formData),
        dataType: 'json',
        contentType: 'application/json'
      }).done(function (res) {
        if (res.success) {
          oThis.addNotificationMsgs(res.notificationMsgs);
        }
      });
      */
    }
  };

  NotificationManager.prototype = proto;

  Notification.Manager = {
    getInstance: function () {
      if (!notificationManager) {
        notificationManager = new NotificationManager();
      }
      return notificationManager;
    }
  };


})(Notification);