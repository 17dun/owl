;(function(){
	var hash = location.hash.substr(1).split('@'),
		guid = hash[0], availW = hash[1], availH = hash[2],
		clickFlag = false, slideFlag = true;
	document.getElementById("userPage").onload = function(){
		var	iframe = window.frames["userPage"].document.body;
		var iframeH = iframe.clientHeight;
		$('#userPage').height(iframeH).width(availW).css({"margin":"0px"});
		$('#heatpic').height(iframeH).width(availW);
		$('#slideCanvas').attr({"height":iframeH, "width":availW});
		$.ajax({
			type : 'get',
			url : 'http://182.254.209.32:9998/?method=getActionByGuid&guid='+guid,
			dataType : 'json',
			success : function(data){
				createHeatMap(data[0]);
				createSlideMap(data[0]);
				$('.list-group a').click(function(){
					var text = $(this).text();
					if(text == "触摸热力图"){
						if(!clickFlag){
							alert('很抱歉，没有触摸数据！');
						}else{
							$(this).addClass('active').siblings().removeClass('active');
							$('#slide').hide();
							$('#click').show();
						}
					}else if(text == "滑屏轨迹图"){
						if(slideFlag){
							$(this).addClass('active').siblings().removeClass('active');
							$('#click').hide();
							$('#slide').show();
						}else{
							alert('很抱歉，没有滑屏数据！');
						}
					}
				});
			},
			error : function(){
				alert('很抱歉，获取用户数据失败！');
			}
		});

	};
	function createHeatMap(data){
		var config = {
			container : document.getElementById('heatpic'),
			radius: 20,
			maxOpacity: 0.7,
			minOpacity: 0.2,
			blur: .75
		};
		var dataPoints = {max: 100, min: 0, data: []};
		var heatmapInstance = h337.create(config);
		
		var actions = data.actions.split('!');
		actions.forEach(function(a, i, as){
			var action = a.split('*');
			if(action[0] == 'c'){
				clickFlag = true;
				var dataPoint = {
						x: parseInt(action[4],36),
						y: parseInt(action[5],36) + parseInt(action[2],36),
						value: 100
					};
				heatmapInstance.addData(dataPoint);
			}
		});
		if(!clickFlag){
			alert('很抱歉，没有触摸数据！');
		}
	}

	function createSlideMap(data){
		var canvas = document.getElementById("slideCanvas"),
			stage = new createjs.Stage(canvas),
			actions = data.actions.split('!'),
			moveData = [], start = 0, end = 0 ;
		//解析出每组滑屏动作数据,每组滑动已c开始u结束,中间有多次m
		actions.forEach(function(a, i, as){
			if(a.charAt(0) === 'u'){
				end = i + 1;
				if(end - start > 2){
					moveData.push(actions.slice(start, end));
				}
				start = i + 1;
			}
		});
		if(moveData.length > 0){
			moveData.forEach(function(m, j, ms){
				stage.addChild(createTrack(m));
			});
			stage.update();
		}else{
			slideFlag = false;
		}
	}

	function createTrack(moveData) {
		var container = new createjs.Container();
		var shape = new createjs.Shape();
		var wid = $("#userPage").width(), hei = $("#userPage").height();
		shape.graphics.setStrokeStyle(7, "round", "round").beginStroke(createjs.Graphics.getRGB(243, 24, 24, 1));
		moveData.forEach(function(m, i, ms){
			var arr = m.split("*");
			var	x = parseInt(arr[4],36),
				y = parseInt(arr[5],36) + parseInt(arr[2],36);
			if(arr[0] === 'c'){
				shape.graphics.moveTo(x, y);
			}else if(arr[0] === 'm'){
				shape.graphics.lineTo(x, y);
			}
		});
		var blurFilter = new createjs.BlurFilter(12, 12, 1);
		shape.filters = [blurFilter];
		var bounds = blurFilter.getBounds();
		shape.cache(90+bounds.x, 50+bounds.y, wid+bounds.width, hei+bounds.height);
		container.addChild(shape);
		return container;
	}
})();