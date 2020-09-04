class Compile {
  constructor(el, vm) {
    this.$el = document.querySelector(el);
    this.$vm = vm;

    if (this.$el) {
      // 转换内部内容为 fragment片段
      this.$fragment = this.node2Fragment(this.$el);
      // 执行编译
      this.compile(this.$fragment);
      // 将编译完成的html追加到$el;
      this.$el.appendChild(this.$fragment);
    }
  }

  // 将宿主元素中代码片段拿出来遍历，这样做比较高效
  node2Fragment(el) {
    const frag = document.createDocumentFragment();
    // 将frag中所有子元素搬家至frag中
    let child;
    while ((child = el.firstChild)) {
      frag.appendChild(child);
    }

    return frag;
  }

  // 编译过程
  compile(el) {
    const childNodes = el.childNodes;

    Array.from(childNodes).forEach((node) => {
      if (this.isElement(node)) {
        // console.log("编译元素", node.nodeName);
        let nodeAttrs = node.attributes;
        Array.from(nodeAttrs).forEach((attr) => {
          const attrName = attr.name; // 属性名
          const exp = attr.value; // 属性值

          if (this.isDirective(attrName)) {
            // r-text
            let dir = attrName.substring(2);
            // 执行指令
            this[dir] && this[dir](node, this.$vm, exp);
          } else if (this.isEvent(attrName)) {
            let dir = attrName.substring(1); // @click 触发事件
            this.eventHandler(node, this.$vm, exp, dir);
          }
        });
      } else if (this.isInterPolation(node)) {
        // console.log("编译文本", node.textContent);
        this.compileText(node);
      }

      // 递归
      if (node.childNodes && node.childNodes.length > 0) {
        this.compile(node);
      }
    });
  }
  isDirective(attr) {
    return attr.indexOf("r-") === 0;
  }
  isEvent(attr) {
    return attr.indexOf("@") === 0;
  }
  // text
  text(node, vm, exp) {
    this.update(node, vm, exp, "text");
  }
  // 双向数据绑定
  model(node, vm, exp) {
    // 指定input 的value属性
    this.update(node, vm, exp, "model");
    // 视图对模型的相应
    node.addEventListener("input", (e) => {
      vm[exp] = e.target.value;
    });
  }
  html(node, vm, exp) {
    this.update(node, vm, exp, "html");
  }
  eventHandler(node, vm, exp, dir) {
    let fn = vm.$options.methods && vm.$options.methods[exp];
    if (dir && fn) {
      node.addEventListener(dir, fn.bind(vm));
    }
  }
  // 编译文本
  compileText(node) {
    // console.log(RegExp.$1);
    // node.textContent = this.$vm.$data[RegExp.$1];
    this.update(node, this.$vm, RegExp.$1, "text");
  }
  // 更新函数
  update(node, vm, exp, dir) {
    let updaterFn = this[dir + "Updater"];
    // 初始化
    updaterFn && updaterFn(node, vm[exp]);
    // 依赖收集
    new Watcher(vm, exp, (value) => {
      updaterFn && updaterFn(node, value);
    });
  }

  modelUpdater(node, value) {
    node.value = value;
  }
  textUpdater(node, value) {
    node.textContent = value;
  }
  htmlUpdater(node, value) {
    node.innerHTML = value;
  }
  // 判断是节点
  isElement(el) {
    return el.nodeType === 1;
  }
  // 判断是文本插值
  isInterPolation(el) {
    return el.nodeType === 3 && /\{\{(.*)\}\}/.test(el.textContent);
  }
}
