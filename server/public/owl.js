//todo: 2，发送时带上环境数据和业务数据   3，一个公共的sendData方法。


var OWLSTATIC = {
	'logid' : '121937',
	'query' : '完美世界857',
	'Baiduid' : 'LJSDLASJDJ',
	'format' : 'iphone',
	'time' : '19289234823',
	'pn' : '10',
	'rn' : '23'
};

/**
 * 移动端的页面都是流式布局的
 * c*1rjr*0*.results~2div~a*57*8e*@
 */

var OWL = {
	/**
	 * 配置参数
	 */
	options : {
		/**
		 * 实验ID
		 */
		sid : '100',
		/**
		 * 抽样率
		 */
		sample : '20',
		/**
		 * 数据上报地址
		 */
		sendSrc:'http://182.254.209.32:9999/w.gif'
	},

	guid : '',

	/**
	 * 日志buffer,用于存储记录的行为数据
	 */
	actionBuffer : [],

	/**
	 * 日志buffer最大的长度，超过长度需要立即发送
	 */
	actionBuffermax : 2000,

	/**
	 * 静态业务数据容器
	 */
	staticBuffer : [],

	/**
	 * 环境数据容器
	 */
	envBuffer : [],

	/**
	 * 行为开始时间
	 */
	startTime : 0,

	/**
	 * 行为结束时间
	 */
	endTime : 0,

	/**
	 * 最大记录时间
	 */
	maxTime : 10*60*1000,

	/**
	 * wise日志的logId，用于串联数据
	 */
	logId : '',

	/**
	 * 数据采集模块的状态
	 */
	logId : '',

	eventList : [],

	/**
	 * 需要收集的静态业务数据
	 */
	staticDataList : [
		'logid',
		'query',
		'time',
		'Baiduid',
		'format',
		'pn',
		'rn'
	],

	/**
	 * 需要收集的环境数据列
	 */
	envDataList : [
		'net',
		'availHeight',
		'availWidth',
		'platform'
	],


	/**
	 * 需要捕获的行为事件列表
	 */
	actionDataList : [

		['touchstart','c'],
		
		['touchmove','m'],
		
		['touchend','u'],

		['touchcancel','l'],
		
		['onorientationchange','ri'],
		
		['gesturestart','gs'],
		
		['gesturechange','gc'],
		
		['gestureend','ge'],
		
		['keydown','k'],

		['focus','f'],

		['focusin','f'],

		['blur','b'],

		['focusout','b'],

		['beforeunload', 'x'],

		['unload', 'x']
	],


	lastAction : {
		ele : null,
		timeStamp : 0,
		path : '',
		type : ''
	},



	/*------------------------------------------*/

	/**
	 * 初始化
	 */
	init : function(){
		var me = this;
		me.guid = me.getGuid();
		me.collectEnv();
		me.collectStatic();
		me.startRecord();	
	},


	/**
	 * 生成唯一标识码
	 */
	getGuid : function(){
	    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	        return v.toString(16);
	    });
	},

	/**
	 * 收集环境数据
	 */
	collectEnv: function(){
		var me = this;
		me.each(me.envDataList,function(i,key){
			var value;
			switch(key){
				case 'net':
					value = '';
					break;
				case 'ua':
				    value = navigator.userAgent;
					break;
				case 'availHeight':
				    value = window.screen.availHeight;
					break;
				case 'availWidth':
				    value = window.screen.availWidth;
					break;
				case 'platform':
				    value = navigator.platform;
					break;
				default:
					value = '';
			}
			me.envBuffer.push(key+'='+value);
		});
	},

	/**
	 * 收集静态业务数据
	 */
	collectStatic : function(){
		var me = this;
		me.each(me.staticDataList,function(i,key){
			//从smarty打过来的全局变量中取
			var value = window.OWLSTATIC[key];
			me.staticBuffer.push(key+'='+value);
		})
	},

	/**
	 * 开始记录
	 */
	startRecord : function(){
		var me = this;
		//阻止多次触发
		if(me.startTime){
			return;
		}
		//记录开始时间
		me.startTime = new Date();

		me.parseAction('a', null);

		//监听开始
		me.each(me.actionDataList,function(i,action){
			var root = /[x]/.test(action[1]) ? window : document
			me.on(root, action[0], function(e){
				me.parseAction(action[1], e);
			})
		});
		
	},


	/**
	 * 停止记录
	 */
	stopRecord : function(){
		var me = this;
		if(!me.startTime){
			return;
		}

		//发送数据,并标识位是当前最后一条数据
		me.sendActionData(true);
		
		//清零时间
		me.startTime = 0;

		//取消事件
		while(item = me.actionDataList.pop()){
			me.un(item[0], item[1], item[2]);
		}

	},

	/**
	 * 解析数据
	 */
	parseAction : function(type, e){
		var me = this;

		var timeStamp = me.timeStamp();
		//如果超过最大记录时间，停止记录
		if(timeStamp>me.maxTime){
			me.stopRecord();
			return;
		}

		//启动时，发送业务数据和环境数据，后续行为数据通过guid关联。
		if(/[a]/.test(type)){
			me.sendStartData();
			return;
		}

		var target = e.target || e.srcElement;
		while(target && target.nodeType != 1){
			target = target.parentNode;
		}
		//获取path路径
		var path = me.getPath(target);

		var lastAction = me.lastAction;

		//移动状态
		if(/[m]/.test(type)){
			if(lastAction.path == path && timeStamp - lastAction.timeStamp <100  && lastAction.type == type){
				return;
			}
		}

		//对于移动和点击事件有坐标。其他的没有。
		if(/[cm]/.test(type)){
			var cx = e.touches[0].clientX.toString(36);
			var cy = e.touches[0].clientY.toString(36);
		}

		//获取键值信息
		if(/[k]/.test(type)){
			var key = e.keyCode.toString(36);
		}

		//关闭窗口,停止监控，立即发送
		if(/[x]/.test(type)){
			me.stopRecord();
			var time  = me.timeStamp();
			while (me.timeStamp() - time < 100){
				/*做一个100ms的等待，减小丢包率*/
			}
			return;
		}

		me.insertAction({
			type : type,
			timeGap : (timeStamp-lastAction.timeStamp).toString(36),
			pageY : (window.pageYOffset|| document.documentElement.scrollTop || document.body.scrollTop).toString(36),
			path : path,
			clientX : cx || '@',
			clientY : cy || '@',
			key : key || '@'
		});

		me.lastAction = {
			ele : target,
			timeStamp : timeStamp,
			path : path,
			type : type
		}
	},

	/**
	 * 解析数据
	 */
	insertAction : function(action){
		//行为单元编码
		var me = this;
		var actionUnit = ''
		me.each(action,function(key,value){
			actionUnit += '*'+value;
		});
		actionUnit = actionUnit.substr(1);

		//满足立即发送条件，这里要再考虑一下业务数据和环境数据的量。
		if(me.countActionBuffer() + actionUnit.length > me.actionBuffermax){
			me.sendActionData();
		}

		//发送之后，buff清零
		me.actionBuffer.push(actionUnit);
	},


	/**
	 * 计算行为buffer
	 */
	countActionBuffer : function(){
		var me = this;
		return me.actionBuffer.join('!').length;
	},

	/**
	 * 清零行为buffer
	 */
	clearActionBuffer : function(){
		var me = this;
		me.actionBuffer = [];
	},


	
	/**
	 * 上报行为数据
	 */
	sendActionData : function(flag){
		var me = this;
		if(flag){
			me.sendData('guid='+me.guid+'&dataType=actions&isClose=1&actions='+me.actionBuffer.join('!'));
		}else{
			me.sendData('guid='+me.guid+'&dataType=actions&actions='+me.actionBuffer.join('!'))
		}
		
		me.clearActionBuffer();
	},


	/**
	 * 上报静态数据
	 */
	sendStartData : function(){
		var me = this;
		var dataArray = OWL.staticBuffer.concat(OWL.envBuffer);
		var queryStr = 'guid='+me.guid+'&dataType=start&startTime='+ me.startTime.getTime()+'&'+dataArray.join('&');
		me.sendData(queryStr);
	},


	sendData : function(dataStr){
		var me = this;
		var options = me.options;
		var queryStr = 'sid='+ options.sid + '&' + dataStr;
		var img=new Image();
		img.src=options.sendSrc+'?'+queryStr;
	},

	/**
	 * 绑定事件
	 */
	on : function(element, eventName, callback){
		var me = this;
		me.eventList.push([element, eventName, callback]);
		if (element.addEventListener){
			element.addEventListener(eventName, callback, false);
		}else {
			element.attachEvent && element.attachEvent("on" + eventName, callback);
		}
	},

	/**
	 * 注销事件
	 */
	un : function(element, eventName, callback){
		if (element.removeEventListener){
			element.removeEventListener(eventName, callback, false);
		}else {
			element.detachEvent && element.detachEvent("on" + eventName, callback);
		}
	},


	/**
	 * 数组,对象循环
	 */
	 each : function(obj,callback){
	 	var i, key;
	 	if(typeof obj.length == 'number'){
	 		for (i = 0; i < obj.length; i++){
	 			if (callback.call(obj[i], i, obj[i]) === false){
	 				return obj;
	 			}
	 		}
	 	}else{
	 		for (key in obj){
	 			if (callback.call(obj[key], key, obj[key]) === false){
	 				return obj;
	 			}
	 		}
	 	}
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
    },


	/**
	 * 计算时间戳
	 */
	timeStamp : function(){
		return new Date - this.startTime;
	}

}

OWL.init();
