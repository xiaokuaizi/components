Swipe的使用方法介绍：

obj:最外层的dom节点
new Swipe(obj,{ 

    curInd: 默认选中第几个  index从0开始

    speed：滑动的速度

    moveX:横向滑动的时候出发的函数，主要用来处理插件间的冲突问题

    callback: 触发了手势滑动的临界点的回调函数

    endTransition: 手势滑动结束后触发的函数
    
   })