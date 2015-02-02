var Hunter = Hunter || {};
void function(exports){
	var max = Math.max, 
		d = document, w = window, dd = d.documentElement, db = d.body, dv = d.defaultView;
	/**
	 * 获取DOM绝对坐标
	 * 参考tangram:baidu.dom.getPosition
	 * @param {Element} element 元素对象
	 */
	function absPos(element){
		if (!element) return;
		var doc = element.nodeType == 9 ? element : element.ownerDocument || element.document, 
			isStrict = document.all && doc.compatMode != "CSS1Compat",
			result = [0, 0],
			viewport = isStrict ? doc.body : doc.documentElement;
		if (element != viewport) {
			var box = element.getBoundingClientRect();
			result[0] = ~~box.left + max(doc.documentElement.scrollLeft, doc.body.scrollLeft);
			result[1] = ~~box.top + max(doc.documentElement.scrollTop, doc.body.scrollTop);

			result[0] -= doc.documentElement.clientLeft;
			result[1] -= doc.documentElement.clientTop;
			
			if (isStrict){
				var style = doc.body.currentStyle || document.defaultView.getComputedStyle(doc.body, null) || {},
					htmlBorderLeftWidth = ~~style.borderLeftWidth,
					htmlBorderTopWidth = ~~style.borderTopWidth;
				result[0] -= isNaN(htmlBorderLeftWidth) ? 2 : htmlBorderLeftWidth;
				result[1] -= isNaN(htmlBorderTopWidth) ? 2 : htmlBorderTopWidth;
			}
		}
		return result;
	}
	/**
	 * 相对坐标转为绝对坐标
	 * @param {Element} element 元素对象
	 * @param {Array} xy 相对坐标
	 */
	function rel2abs(element, xy){
		if (!element) return;
		if (!element.offsetWidth && !element.offsetHeight) return;
		if(xy[0] < 0 || xy[1] < 0) return;
		var pos = absPos(element), size = getElementSize(element);
		return [
			~~(xy[0] * size[0]) + pos[0],
			~~(xy[1] * size[1]) + pos[1]
		];
	}
/*start hunter*/
	function relPos(element, pos, grid) {
		//console.log(element, pos, grid);
		var box = element.getBoundingClientRect(), size = getElementSize(element);
		grid = grid || 1;
		function format(number){
			return String(+number.toFixed(3)).replace(/^0\./g, '.');
		}
		// console.log(floor((pos[0] - box.left) / grid) * grid + '|' + size[0] + ' ' + floor((pos[1] - box.top) / grid) * grid + '|' + size[1]);
		return [
			format(~~((pos[0] - box.left) / grid) * grid / size[0]),
			format(~~((pos[1] - box.top) / grid) * grid / size[1])
		];
	}
	
	function getElementSize(element) {
		var box = element.getBoundingClientRect();
		return [~~(box.right - box.left), ~~(box.bottom - box.top)];
	}

	function getPageSize() {
		var doc_size = getElementSize(dd), body_size = getElementSize(db);
		return [
			max(doc_size[0], body_size[0], w.innerWidth || 0, dd.scrollWidth || 0),
			max(doc_size[1], body_size[1], w.innerHeight || 0, dd.scrollHeight || 0)
		];
	}

	function visibleRange(){
		return [
			max(dd.scrollLeft || 0, db.scrollLeft || 0, (dv && dv.pageXOffset) || 0),
			max(dd.scrollTop || 0, db.scrollTop || 0, (dv && dv.pageYOffset) || 0),
			w.innerWidth || dd.clientWidth || db.clientWidth || 0,
			w.innerHeight || dd.clientHeight || db.clientHeight || 0
		];
	}
/*end hunter*/

	exports.getPageSize = getPageSize;
	exports.getElementSize = getElementSize;
	exports.visibleRange = visibleRange;
	exports.relPos = relPos;
	exports.absPos = absPos;
	exports.rel2abs = rel2abs;
}(Hunter);