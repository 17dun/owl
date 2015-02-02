var Hunter = Hunter || {};
void function(exports){
	/**
	 * Hunter
	 * Dom路径获取和还原
	 * @author 王集鹄(wangjihu，http://weibo.com/zswang)
	 * @version 2011-09-08
	 * @copyright (c) 2011, Baidu Inc, All rights reserved.
	 */
	 var w = window, d = document, db = d.body, dd = d.documentElement;
/*start hunter*/
	/**
	 * 获取Dom路径 格式：.<id>、~<count><tagName>
	 * @param {Element} node Dom节点对象
	 * @return 返回Dom路径
	 */
	function getPath(node){
		if (!node || node.nodeType != 1 || /^(html|body)$/i.test(node.tagName)) {
			return node && /^html$/i.test(node.tagName) ? "~html" : "";
		}
		var id = '' + (node.getAttribute && node.getAttribute('id'));
		if (id && id.length < 11 && !(/tangram/i.test(id)) && d.getElementById(id) == node) // Avoid id repeat
			return '.' +
			id.replace(/[!-\/\s~^]/g, function(all){
				return "%" + (0x100 + all.charCodeAt()).toString(16).substr(1);
			});
		var count = 1, sibling = node.previousSibling, key = 'nodeName';
		while (sibling){
			count += sibling[key] == node[key];
			sibling = sibling.previousSibling;
		}
		return getPath(node.parentNode) + '~' + (count < 2 ? "" : count) + node[key].toLowerCase();
	}
	
	function getGroup(node) {
		if (!node || node.nodeType != 1 || /^(html|body)$/i.test(node.tagName)) {
			return;
		}
		var group = node.getAttribute && node.getAttribute('hgroup');
		if (group) return node;
		return getGroup(node.parentNode);
	}
/*end hunter*/
	/**
	 * 获取Dom路径 格式：.<id>、~<count><tagName>
	 * @param {string} path
	 * @return 返回路径对应的Dom对象
	 */
	function getElement(path, doc){
		doc = doc || d;
		var element = doc.body, m, el;
		if (path === '') return element;
		if (path == '~html') return doc.documentElement;
		if (!path) return; // null、undefined
		path = '' + path;
		m = path.match(/^(.+)\/(.*)$/);
		if (m){
			el = getElement(m[1], doc);
			if (el){
				try{
					return getElement(m[2], el.contentWindow.document);
				} catch(ex){}
			}
			return;
		}
		path.replace(/(\.)([^~\n]+)|(~)(\d*)(\w+)/g, function(){
			var args = arguments;
			if (args[1]){
				element = doc.getElementById(decodeURIComponent(args[2]));
				return;
			}
			if (!element) return;
			var count = args[4] || 1,
				nodes = element.getElementsByTagName(args[5]);
			for (var i = 0, l = nodes.length; i < l; i++){
				var node = nodes[i];
				if (node.parentNode == element && !--count){
					element = node;
					break;
				}
			}
			if (count) element = null; // 没有找到
		});
		return element;
	}
	
	exports.getElement = getElement;
	exports.getPath = getPath;
	exports.getGroup = getGroup;
}(Hunter);