define(function(require,exports,module){
    var swipe = function($wrap, opt) {
        this.$wrap = typeof $wrap === "string" ? $($wrap) : $wrap;
        this.options = $.extend({
            curInd: 0,
            speed: 300,
            moveX:function(x,y){},
            callback: function(index) {},
            transitionEnd: function(index) {}
        }, opt);

        //$item：手势滑动的所有的dom元素,$containt为手势滑动元素的外框，winW：可视窗口的宽度
        this.winW = this.$wrap.get(0).getBoundingClientRect().width || this.$wrap.get(0).offsetWidth;
        this.$containt = this.$wrap.children().eq(0);
        this.$item = this.$containt.children();
        this.loading = false;
        this.$item.length-1 &&  this.init();
    }
    swipe.prototype = {
        init: function() {
            var _this = this,
                index = this.options.curInd;
            this.$containt.width(this.winW * this.$item.length);

            //初始化某个滑动元素的left和translateX的值
            this.$item.each(function() {
                var ind = _this.$item.index($(this)),
                    translateX = index > ind ? (-1) * _this.winW : (index < ind ? _this.winW : "0");
                $(this).width(_this.winW).attr("data-index", ind).css({
                    "left": _this.winW * ind * (-1) + "px"
                });
                _this.transFn($(this).width(_this.winW).attr("data-index", ind),translateX,0);
            });

            // dirFlag -1为向右，1向左,0 不滑动
            this.dirFlag = -1;
            this.isMove = true;
            this.touchEvent();
        },

        /*
        * 改变translateX的值
        */
        transFn: function(obj,transX,speed){
            obj.css({
                "transform": "translate(" + transX + "px, 0px) translateZ(0px)",
                "transition": "transform "+speed+"s ease-in",
                "-webkit-transform": "translate(" + transX + "px, 0px) translateZ(0px)",
                "-webkit-transition": "-webkit-transform "+speed+"s ease-in"
            });
        },

        /*
        * touch事件
        */
        touchEvent: function() {
            var _this = this;
            this.$containt.bind("touchstart", function(e) {
                this.touchStatX = e.targetTouches[0].pageX;
                this.touchStatY = e.targetTouches[0].pageY;
                this.timeStart = new Date().getTime();
                this.moveX = false;
                this.moveY = false;
            }, false).bind("touchmove", function(e) {
                if (_this.loading) {return;}
                this.touchEndX = e.targetTouches[0].pageX;
                this.touchEndY = e.targetTouches[0].pageY;
                this.tempNumX = this.touchEndX - this.touchStatX;
                this.tempNumY = this.touchEndY - this.touchStatY;
                _this.dirFlag = this.tempNumX > 0 ? -1 : 1;
                _this.curTran = this.tempNumX;
                //横向和纵向事件不可同时触发
                if(Math.abs(this.tempNumX) > Math.abs(this.tempNumY) && !this.moveY){
                    this.moveX = true;
                }
                if(Math.abs(this.tempNumY) >= Math.abs(this.tempNumX) && !this.moveX){
                    this.moveY = true;
                }

                //横向滑动
                if (this.moveX) {
                    e.preventDefault();
                    _this.options.moveX(this.tempNumX,this.tempNumY);

                    _this.prevInd = (_this.options.curInd - 1) >= 0 ? _this.options.curInd - 1 : 0;
                    _this.nextInd = (_this.options.curInd + 1) <= _this.$item.length - 1 ? _this.options.curInd + 1 : _this.$item.length - 1;
                    
                    //临界元素和当前元素是同一个时做特殊处理（受滑动方向影响）
                    _this.tempTranL = _this.prevInd == _this.options.curInd  ?  (_this.dirFlag == -1 ? 0 : this.tempNumX) : (-1)*_this.winW+this.tempNumX;
                    _this.tempTranR = _this.nextInd == _this.options.curInd ? (_this.dirFlag == 1 ? 0 : this.tempNumX) : _this.winW + this.tempNumX;

                    //同时处理三个元素---同时处理两个在快速滑动的时候会有bug，位置计算不准确
                    _this.transFn(_this.$item.eq(_this.options.curInd),_this.curTran,0);
                    _this.transFn(_this.$item.eq(_this.prevInd),_this.tempTranL,0);
                    _this.transFn(_this.$item.eq(_this.nextInd),_this.tempTranR,0);
                }
            }, false).bind("touchend", function(e) {
                if (this.moveX) {
                    this.timeEnd = new Date().getTime();
                    //滚动的临界点 1>时间少于150ms且距离大于10  2>滑动的距离大于可视窗口宽度的一半
                    if (((this.timeEnd - this.timeStart < 350 && Math.abs(this.tempNumX) > 20) || (Math.abs(this.tempNumX) >= _this.winW / 2)) && this.tempInd != _this.options.curInd) {
                        _this.isMove = true;
                    } else {
                        _this.isMove = false;
                    }
                    _this.slide();    
                }
            }, false);
        },

        /*
        * 设置滑动元素的translateX值
        */
        positionInit: function(ind,curInd) {
            //点击tab进行切换可能跨多个角标值，所以需要对translateX进行重置
            var _this = this;
            this.$item.each(function() {
                var index = _this.$item.index($(this)),translateX;
                
                if (curInd > index && index > ind) {
                    translateX =  _this.winW;
                }
                if (ind > index && index > curInd) {
                    translateX = (-1)*_this.winW;
                }
                translateX && _this.transFn($(this),translateX,0);
            });
        },

        /*
        * 滑动的函数
        */
        slide: function(ind) {
            if (this.loading) {return;}
            var _this = this;
            var prevInd = this.prevInd,
                nextInd = this.nextInd,
                curInd = this.options.curInd,
                curX,nextX,prevX,
                speed = this.options.speed/1000;

            //夸角标点击时需要重置各个元素的translateX值,手势滑动不需要传ind参数
            if (ind + 1) {
                if (ind > curInd) {
                     nextInd = ind;
                     this.dirFlag = 1;
                     prevInd = curInd;
                }else if(ind < curInd){
                    prevInd = ind;
                    this.dirFlag = -1;
                    nextInd = curInd;
                }else{
                    return;
                }
                this.isMove = true;
                this.positionInit(ind,curInd);
            }
            this.loading = true;
            //获取translateX的值
            if (this.isMove) {
                if (_this.dirFlag == -1) {
                    prevX = 0;
                    nextX = this.winW;
                    curX = curInd == prevInd ? 0 :this.winW;
                }else{
                    prevX = (-1) * this.winW;
                    nextX = 0;
                    curX = curInd == nextInd ? 0 : (-1) * this.winW ;
                }
            } else {
                curX = 0;
                prevX = curInd == prevInd ? 0 : (-1) * this.winW;
                nextX = curInd == nextInd ? 0 : this.winW;
            }

            this.transFn(this.$item.eq(curInd),curX,speed);
            nextInd!=curInd && this.transFn(this.$item.eq(nextInd),nextX,speed);
            prevInd!=curInd && this.transFn(this.$item.eq(prevInd),prevX,speed);
            
            //滑动完成，重置当前curInd的值
            var endCurInd =  this.isMove && this.dirFlag == -1 ? prevInd : (this.isMove && this.dirFlag == 1 ? nextInd : curInd);
            //可切换的临界点可执行callback函数
            this.isMove && endCurInd!=curInd &&  this.options.callback(endCurInd,this.$item.eq(endCurInd));
            //slide执行结束时可执行endTransition函数
            var f = setTimeout(function(){
                _this.options.transitionEnd(endCurInd,_this.$item.eq(endCurInd));
                _this.options.curInd = endCurInd;
                _this.loading = false;
            },_this.options.speed);
        }
    }
    module.exports = swipe;
});