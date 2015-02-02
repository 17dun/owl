    var visibleMonitor = {
      visibleHeight : 0,
      lastBottomLineHeight : 0,
      imgSrc : 'http://m.baidu.com/u.gif',
      pid : 1,
      hasStop : true,
      //初始化
      init : function(){
        var me = this;
        me.visibleHeight = window.screen.availHeight;
        me.bindEvent();
        me.freshBottomLineHeight();
      },
      //绑定事件
      bindEvent : function(){
        var me = this;
        $('body').on('touchend',function(){
          me.hasStop = false;
          //先算一遍
          if(!me.lastBottomLineHeight){
          	me.freshBottomLineHeight();
          }else{
          	//检查是否有惯性滑动
          	setTimeout(function(){me.freshBottomLineHeight()},200);
          }
        })

      },

      //更新基线高度
      freshBottomLineHeight : function(){
        var me = this;
        var scrollTop = window.pageYOffset|| document.documentElement.scrollTop || document.body.scrollTop;
        var bottomLineHeight = scrollTop+me.visibleHeight;
        if(bottomLineHeight!=me.lastBottomLineHeight){
            me.lastBottomLineHeight = bottomLineHeight;
            me.checkCardInvisible();
        }
      },

      //检查在可视区中的卡片
      checkCardInvisible : function(){
        var me = this;
        $('.result').each(function(i,item){
         //计算位置
         var contentLineHeight = $(item).offset().top+$(item).offset().height;
         if(contentLineHeight<me.lastBottomLineHeight&&$(item).offset().top>me.lastBottomLineHeight-me.visibleHeight){
              me.setColor(item);
         }else{
              me.clearColor(item);
         }
        })
        me.sendLog();
      },

      //给卡片设置色块
      setColor : function(item){
        $(item).addClass('visible');
      },

      clearColor : function(item){
         $(item).removeClass('visible');
      },

      //发送日志
      sendLog : function(){
      	var me = this;
      	var visibleList = [];
        $('.visible').each(function(i,item){
        	visibleList.push(me.getPath(item));
        });
        visibleStr = visibleList.join('|');
        $.ajax({
        	'type':'get',
        	'url':'http://m.baidu.com/',
        	'dataType':'json',
        	'data':{
        		'pid':me.pid,
        		'visibleHeight':me.visibleHeight,
        		'visiblePath':visibleStr
        	}
        });

        var topY =   me.lastBottomLineHeight-me.visibleHeight;
        var bottomY = me.lastBottomLineHeight;
        console.log($('.visible').length+'条结果\n当前可视范围:'+topY+'px~'+bottomY+'px\n可视结果path：'+visibleStr);
      },

      getPath : function(node){
        var me = this;
        var previousSibling = 'previousSibling';
        if (!node || node.nodeType != 1 || /^(html|body)$/i.test(node.tagName)) {
          return node && /^html$/i.test(node.tagName) ? "~html" : "";
        }
        var id = '' + (node.getAttribute && node.getAttribute('id'));
        if (id && id.length < 11 && !(/tangram/i.test(id)) && document.getElementById(id) == node) // Avoid id repeat
          return '.' +
          id.replace(/[!-\/\s~^]/g, function(all){
            return "%" + (0x100 + all.charCodeAt())[toString](16).substr(1);
          });
        var count = 1, sibling = node[previousSibling], key = 'nodeName';
        while (sibling){
          count += sibling[key] == node[key];
          sibling = sibling[previousSibling];
        }
        return this.getPath(node.parentNode) + '~' + (count < 2 ? "" : count) + node[key].toLowerCase();
      }

    }
  visibleMonitor.init();