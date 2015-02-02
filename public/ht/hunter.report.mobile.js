var Hunter = Hunter || {};

void function(exports){
	var
	/**
	 * 上报配置
	 */
		reportConfig = {
			/*
			 * 网格大小
			 */
			grid: 1,
			/**
			 * 日志标识
			 */
			pid: 240,
			/**
			 * 实验标识
			 */
			hid: 1,
			/**
			 * 上报地址
			 */
			logPath: ''
		},
/*start hunter-group-values*/
	/*
	 * 分组监听
	 */
		lastGroupRecordParams,
		groupListeners = [
			['click', 'c'],
			['dblclick', 'l'],
			['focus', 'f'],
			['blur', 'b'],
			['mousemove', 'm'],
			['mousedown', 'd'],
			['mouseover', 'e'],
			['mouseout', 'o'],
			['mouseup', 'u'],
			['keydown', 'k'],
			['scroll', 's', w]
		],
/*end hunter-group-values*/
/*start hunter-values*/
	/*
	 * 事件列表
	 */
		eventList = [],
	/*
	 * 缩短标识符
	 */
		w = window, d = document, db = d.body, dd = d.documentElement, dv = d.defaultView, max = Math.max,
	/**
	 * 冷冻时间
	 */
		freezeTime = 100,
	/**
	 * 起始时间
	 */
		startTime,
	/**
	 * 等待上报的记录
	 */
		buffer,
	/*
	 * 等待上报的分组记录
	 */
		groupBuffer,
	/**
	 * 上报记录占用的大小
	 */
		bufferCount,
	/**
	 * 会话id
	 */
		sid,
	/**
	 * 屏幕分辨率
	 */
		px = w.screen.width + "*" + w.screen.height,
	/**
	 * 上报序号
	 */
		seq,
	/**
	 * 可见区域
	 */
		vr,
	/*
	 * 页面高宽
	 */
		ps,
	/**
	 * 初始大小
	 * 计算的代码：
initBuffer = (reportConfig.logPath + '?' + json2query({
	pid: reportConfig.pid,
	hid: reportConfig.hid,
	sid: sid,
	seq: 100,
	vr: vr,
	px: px,
	dv: 2
}) + '&').length;
	 */
		initBuffer = 110,
	/**
	 * IE6 Max Url Length = 2083
	 * 最大缓存数，预留23byte缓冲
	 */
		maxBuffer = 2060,
	/**
	 * 最大记录时间，30分钟
	 */
		maxRecordTime = 1000 * 60 * 30,
	/*
	 * 最后记录数据
	 */
		lastRecordParams,
	/*
	 * 最后记录的元素
	 */
		lastRecordElement,
	/*
	 * 最后写入的数据
	 */
		lastWriteParams,
	/**
	 * 后上报的数据 [计时器,回调函数]
	 */
		waitRecorder,
	/**
	 * 最后一成焦点控件
	 */
		activeElement,
	/*
	 * 绑定了附加事件
	 */
		eventFlag,
	/*
	 * 监听列表
	 */
		listeners = [
			/*
			 * [mlducwr]鼠标事件 p0=path p1=x p2=y p3=button(1 left, 2 middle, 3 right)
			 */
			['mousemove', 'm'],
			['mousedown', 'd'],
			['contextmenu', 'r'],
			['mouseup', 'u'],
			['click', 'c'],
			['dblclick', 'l'],
			/*
			 * [k]键盘事件 p0=path p1=code p2=control
			 */
			['keydown', 'k'],
			/*
			 * 滚轮事件 p0=path p1=x p2=y p3=detail(0-down 1-up)
			 */
			['mousewheel', 'w'],
			['DOMMouseScroll', 'w', w],
			/*
			 * 滚动事件 p0=top p1=left
			 */
			['scroll', 's', w],
			/*
			 * 窗体大小改变 p0=height p1=width
			 */
			['resize', 'e', w],
			/*
			 * 页面关闭
			 */
			['beforeunload', 'z', w],
			['unload', 'z', w],
			/*
			 * 窗体失去焦点 p0=min
			 */
			['focusout', 'o'],
			['blur', 'o', w],
			/*
			 * 元素获得焦点
			 */
			['focusin', 'i'],
			['focus', 'i', w]
			/*
			 * f 焦点控件变化
			 */
		],
	/*
	 * user agent
	 */
		ua,
	/*
	 * 是否为gecko内核
	 */
		isGecko = /gecko/i.test(navigator.userAgent),
		
		ontimer,
	/*
	 * 鼠标当前状态
	 */
		mouseButton
/*end hunter-values*/
		;
	
/*start hunter-group*/
	/*
	 * 写入分组信息
	 */
	function writeGroup(type, from, to, x, y){
		//B*B~m~B~858*35~1330579806227!
		var groupMessage = [from + '*' + to, type, to, x + '*' + y, +new Date].join('~') + '!';
		bufferCount += groupMessage.length;
		if (bufferCount > maxBuffer){
			report({
				data: buffer.join('') + '@@' + groupBuffer.join('')
			});
			bufferCount = initBuffer;
			buffer = [];
			groupBuffer = [];
		}
		groupBuffer.push(groupMessage);
	}
	
	function groupRecord(type, e, /*var */target, name, time, pos, box){
		if (type == 's'){
			box = exports.visibleRange();
			writeGroup(type, lastGroupRecordParams[1] || '', '', box[0], box[1]);
			lastGroupRecordParams = [null, '', type, time];
			return;
		}
		target = e.target || e.srcElement;
		if (lastGroupRecordParams[0] != target){
			target = exports.getGroup(target);
		}
		if (!target) return;
		time = +new Date;
		name = exports.groupName(target);
		if (type == 'm' && name == lastGroupRecordParams[1] &&
			lastGroupRecordParams[2] == 'm' &&
			time - lastGroupRecordParams[3] < 100) return;
		box = target.getBoundingClientRect();
		writeGroup(type, lastGroupRecordParams[1] || '', name, ~~(e.clientX - box.left), ~~(e.clientY - box.top));
		lastGroupRecordParams = [target, name, type, time]
	}
/*end hunter-group*/

/*start hunter*/
	/*
	 * 对flash对象进行绑定
	 */
	function onFlash(/*var */flashs, i, j, flash, listener){
		flashs = d.getElementsByTagName(d.all ? 'object' : 'embed');
		for (i = 0; flash = flashs[i++]; ){
			if (!flash[eventFlag]){
				flash[eventFlag] = 1;
				for (j = 0; (listener = listeners[j]) && j < 7; j++){
					on(flash, listener[0], (function(type){
						return function(e){
							record(type, e);
						};
					})(listener[1]));
				}
			}
		}
	}
	
	function onIframe(/*var */iframes, frame, i, j, listener, doc){
		iframes = document.getElementsByTagName('iframe');
		for(i = 0; i < iframes.length; i++){
			iframe = iframes[i];
			try{
				if (!iframe.contentWindow[eventFlag]){
					iframe.contentWindow[eventFlag] = 1;
					doc = iframe.contentWindow.document;
					for (j = 0; (listener = listeners[j]) && j < 7; j++){
						on(doc, listener[0], (function(type, path, doc){
							return function(e){
								if (isGecko){ // firefox
									if ('d' == type) mouseButton = getMouseButton(e);
									if ('u' == type) mouseButton = 0;
								}
								record.call({ path: path, doc: doc, flag: eventFlag }, type, e);
							};
						})(listener[1], exports.getPath(iframe), doc));
					}
				}
			}catch(ex){
			}
		}
	}


	/**
	 * 绑定事件
	 * @param {Element} element 绑定事件对象
	 * @param {String} eventName 事件名
	 * @param {Function} callback 回调函数
	 */
	function on(element, eventName, callback){
		eventList.push([element, eventName, callback]);
		if (element.addEventListener)
			element.addEventListener(eventName, callback, false);
		else {
			element.attachEvent && element.attachEvent("on" + eventName, callback);
		}
	}

	/**
	 * 注销事件绑定
	 * @param {Element} element 绑定事件对象
	 * @param {String} eventName 事件名
	 * @param {Function} callback 回调函数
	 */
	function un(element, eventName, callback, undefined){
		if (element.removeEventListener)
			element.removeEventListener(eventName, callback, false);
		else {
			element.detachEvent && element.detachEvent("on" + eventName, callback);
		}
		element[eventFlag] = undefined;
	}

	/**
	 * 获取鼠标按键
	 * 左键1 中间2 右键3
	 */
	function getMouseButton(event){
		return event.which || event.button && 
			(event.button & 1 ? 1 : (event.button & 2 ? 3 : (event.button & 4 ? 2 : 0)));
	}

	/**
	 * 清除所有的时间注册
	 */
	function unall(/* var */item){
		while(item = eventList.pop()){
			un(item[0], item[1], item[2]);
		}
	}

	/**
	 * 计算时间戳
	 */
	function timeStamp(){
		return new Date - startTime;
	}
	/**
	 * 写入到上报数据中
	 */
	function writeData(params, /*var */message, i){
		//m340703*div.mask*1004*433*!
/*
 * 测试用例
var datas = [
	'm*2736*.tool*.8*.54*',
	'f*2736*0***',
	's*2736*200*199**',
	'i*2736*0*0*1256*577'
];
datas.forEach(function(item){
	console.log(item.replace(/\*0\b/g, "").replace(/^(.)\*|\*+$/g, "$1") + '!');
});
*/

		params = params.slice(); // clone
		params[1] = params[1].toString(36);
/*end hunter*/
		exports.dispatchEvent && exports.dispatchEvent('data', {
			message: params.join('*').replace(/\*0\b/g, "*").replace(/^(.)\*|\*+$/g, "$1") + '!',
			params: params,
			sid: sid,
			pid: reportConfig.pid,
			hid: reportConfig.hid
		});
/*start hunter*/
		if (/[mlducwrkfh]/.test(params[0])){ // 含element类型
			for (i = 2; i < params.length; i++){
				if (('' + params[i]).length > 1){
					if (params[i] === lastWriteParams[i]){
						params[i] = '^';
					} else {
						lastWriteParams[i] = params[i];
					}
				}
			}
		}

		message = params.join('*').replace(/\*0\b/g, "*").replace(/^(.)\*|\*+$/g, "$1") + '!';
		bufferCount += message.length;
		if (bufferCount > maxBuffer){
			report({
				data: buffer.join('') + (reportConfig.group ? '@@' + groupBuffer.join('') : '')
			});
			bufferCount = initBuffer;
			buffer = [];
			groupBuffer = [];
		}
		buffer.push(message);
	}
	/**
	 * 记录日志
	 * @param {String} type 类型
	 * @param {Event} e 事件对象
	 */
	function record(type, e, /*var */path, ts, params, range, pos, message, target){
		ts = timeStamp();
		if (waitRecorder){ // 有窗体离开的计时器
			clearTimeout(waitRecorder[0]);
			if (ts - waitRecorder[2] > 50)
				waitRecorder[1]();
			else waitRecorder = 0;
		}
		if (d.activeElement != activeElement){ // 焦点控件变化
			writeData(['f', ts, exports.getPath(d.activeElement)]);
			activeElement = d.activeElement;
		}
		if (!e){
			writeData([type, ts]);
		}
		if (ts > maxRecordTime){ // 超过最大记录时间
			stop();
			return;
		}
		if ('i' == type && null !== waitRecorder){ // 元素获得焦点并最后一次是不是窗体离开
			return;
		}
		target = e.target || e.srcElement;
		while(target && target.nodeType != 1){ //text
			target = target.parentNode;
		}
		if (lastRecordElement[0] == target){
			path = lastRecordElement[1];
		} else {
			if (this.flag == eventFlag && this.doc){
				path = this.path + '/' + exports.getPath(target, this.doc);
			} else {
				path = exports.getPath(target);
			}
		}
		lastRecordElement = [target, path];
		//    0,  1,  2,  3,  4,  5 default
		//[type, ts, p0, p1, p2, p3]
		params = [type, ts, path];
		if(/[mw]/.test(type)){ // 移动或滚轮事件
			if (
				lastRecordParams[0] == type && // 同类操作
				ts - lastRecordParams[1] < freezeTime && // 间隔太小
				lastRecordParams[2] == params[2] // path相同
			) return;
			lastRecordParams = params.slice(0, 3); // 聚焦事件忽略
		}
		if (target && !target[eventFlag] && /select/i.test(target.tagName)){
			target[eventFlag] = 1;
			on(target, 'change', function(e) {
				record('h', e);
			});
		} 

		if ('o' == type){
			waitRecorder && clearTimeout(waitRecorder[0]);
			waitRecorder = function(){
				waitRecorder = null;
				//    0,  1,   2
				//[type, ts, min]
				params[2] = +(Math.min(w.screenTop || 0, w.screenY || 0) < -22932);
				writeData(params);
			};
			waitRecorder = [setTimeout(waitRecorder, 1000), waitRecorder, ts];
		} else {
			if (/[se]/.test(type)){
				//    0,  1,    2,        3,  4,  5
				//s[type, ts, top,     left, p2, p3]
				//e[type, ts, height, width, p2, p3]
				range = exports.visibleRange();
				params[3] = range[[0, 2][+(type == 'e')]];
				params[2] = range[[1, 3][+(type == 'e')]];
			} else if ('i' == type){
				//    0,  1
				//s[type, ts]
				params[2] = '';
			} else if (target){
				if (/[mlducwr]/.test(type)){
					//    0,  1,    2, 3, 4,  5
					//[type, ts, path, x, y, p3]
					pos = exports.relPos(target, [e.clientX, e.clientY], reportConfig.grid);
					if (!pos) return;
					params[3] = pos[0];
					params[4] = pos[1];
					if (/[cdul]/.test(type)) params[5] = getMouseButton(e);
					if (type == 'm') params[5] = isGecko ? mouseButton : getMouseButton(e);
					if (type == 'w') // 滚轮
						params[5] = +((e.wheelDelta || e.detail) < 0); // 是否向上滚动
				} else if ('k' == type){
					//    0,  1,    2,    3,       4,  5
					//[type, ts, path, code, control, p3]
					params[3] = /password/i.test(target.type) ? 1 : e.keyCode;
					params[4] = [+e.altKey || 0, +e.ctrlKey || 0, +e.shiftKey || 0, +e.metaKey || 0].join('');
				} else if ('h' == type) {
					//    0,  1,    2,             3
					//[type, ts, path, selectedIndex]
					params[3] = target.selectedIndex;
				}
			}
			writeData(params);
		}
		if (/[dcukio]/.test(type)){
			onIframe();
			onFlash();
			ontimer && clearInterval(ontimer);
			ua = 0;
			ontimer = setInterval(function(){
				onIframe();
				onFlash();
				if (ua++ > 3){
					ontimer && clearInterval(ontimer);
					ua = 0;
					ontimer = 0;
				}
			}, 1000);
		}
	}
	/**
	 * 停止监听
	 */
	function stop(){
		if (!startTime) return;
/*end hunter*/
		exports.dispatchEvent && exports.dispatchEvent('stop');
/*start hunter*/
		report({
			cmd: 'close',
			data: buffer.join('') + 'z' + timeStamp().toString(36) + (reportConfig.group ? '@@' + groupBuffer.join('') : '')
		});
		bufferCount = initBuffer;
		buffer = [];
		groupBuffer = [];

		startTime = 0;
		unall();
	}
	/*
	 * 将json对象转换成url请求参数above
	 * @param {Object} data json数据
	 */
	function json2query(data, /*var */result, p){
		result = [];
		for (p in data){
			if (typeof data[p] != 'undefined')
				result.push(p + '=' + decodeURIComponent(data[p]));
		}
		return result.join("&");
	}
	/**
	 * 开始采集数据
	 */
	function start(/*var */i, listener, ts){
		if (!dd || !dd.getBoundingClientRect) return;
		if (startTime) return;
/*end hunter*/
		if (typeof exports.getConfig == "function"){
			reportConfig = exports.getConfig();
		}

/*start hunter*/
		startTime = new Date;
		vr = exports.visibleRange();
		ps = exports.getPageSize();
		sid = (+startTime).toString(36) + (+Math.random().toFixed(8).substr(2)).toString(36);
		eventFlag = '_e_' + sid;

/*end hunter*/
		exports.dispatchEvent && exports.dispatchEvent('start', {
			startTime: startTime,
			pid: reportConfig.pid,
			hid: reportConfig.hid,
			sid: sid
		});
/*start hunter*/
		seq = 0;
		bufferCount = initBuffer;
		buffer = [];
		groupBuffer = [];
		lastWriteParams = [];
		lastRecordParams = [];
		lastRecordElement = [];
		lastGroupRecordParams = [];
		writeData(['a', 0, vr[0], vr[1], vr[2], vr[3], exports.getPath(d.activeElement)]);
		activeElement = d.activeElement;
		report({
			cmd: 'open',
			ref: encodeURIComponent(d.referrer),
			data: buffer.join('')
		});
		
		for (i = 0; listener = listeners[i++]; ){
/*
测试用例
console.log(/(focus.)|blur/.test('focusin') && (!RegExp.$1 ^ !document.all))
console.log(/(focus.)|blur/.test('focusout') && (!RegExp.$1 ^ !document.all))
console.log(/(focus.)|blur/.test('blur') && (!RegExp.$1 ^ !document.all))
console.log(/(focus.)|blur/.test('focus') && (!RegExp.$1 ^ !document.all))
*/
			if (/(focus.)|blur|focus/.test(listener[0]) && (!RegExp.$1 ^ !d.all)) continue;
			on(listener[2] || d, listener[0], (function(type){
				return function(e){
					if (type == 'z'){ // close
						stop();
						ts = timeStamp();
						while (timeStamp() - ts < 100){
							/* sleep */
						}
						return;
					}
					if (isGecko){ // firefox
						if ('d' == type) mouseButton = getMouseButton(e);
						if ('u' == type) mouseButton = 0;
					}
					record(type, e);
				};
			})(listener[1]));
		}
		onFlash();
		onIframe();
/*end hunter*/
		if (reportConfig.group) {
			for (i = 0; listener = groupListeners[i++];){
				on(listener[2] || d, listener[0], (function(type){
					return function(e){
						groupRecord(type, e);
					};
				})(listener[1]));
			}
		}
	}

	/**
	 * 上报数据
	 * @param {Object} params 上报数据
	 */
	function report(params){
		if (!params) return;
		exports.dispatchEvent('report', reportConfig.logPath + '?' + json2query({
/*start hunter-report-head*/
			pid: reportConfig.pid,
			hid: reportConfig.hid,
			qid: w.bdQid, // 上报ps的qid
			gr: reportConfig.grid,
			sid: sid,
			seq: seq++,
			px: px,
			ps: ps,
			/*
			 * 初始可视范围
			 */
			vr: vr,
			/*
			 * 数据版本
			 */
			dv: 3 
/*end hunter-report-head*/
		}) + '&' + json2query(params));

/*start hunter-report-reset*/
		vr = exports.visibleRange();
		ps = exports.getPageSize();
		lastWriteParams = [];
/*end hunter-report-reset*/
	}

	exports.start = start;
	exports.stop = stop;
}(Hunter);