// new RVue({data: {}})

class RVue {
  constructor(options) {
    this.$options = options;
    this.$data = options.data;

    this.observe(this.$data);

    // 模拟watcher创建
    // new Watcher();
    // this.$data.title;
    // new Watcher();
    // this.$data.desc.version;

    new Compile(options.el, this);

    // created 执行
    if (options.created) {
      options.created.call(this);
    }
  }

  observe(value) {
    if (!value || typeof value !== "object") return;

    Object.keys(value).forEach((key) => {
      this.defineReactive(value, key, value[key]);
      // 代理 date中的属性到 vue实例 vm上
      this.proxyData(key);
    });
  }
  // 数据响应式
  defineReactive(obj, key, value) {
    // 数据嵌套
    this.observe(value);

    let dep = new Dep();

    Object.defineProperty(obj, key, {
      get() {
        Dep.target && dep.addDep(Dep.target);
        return value;
      },
      set(newVal) {
        if (value === newVal) return;
        value = newVal;
        // console.log(`属性${key} 更新了`);
        dep.notify();
      },
    });
  }
  // 代理
  proxyData(key) {
    Object.defineProperty(this, key, {
      get() {
        return this.$data[key];
      },
      set(newValue) {
        if (newValue === this.$data[key]) {
          return;
        }
        this.$data[key] = newValue;
      },
    });
  }
}

// 依赖管理
class Dep {
  constructor() {
    this.deps = [];
  }

  addDep(dep) {
    this.deps.push(dep);
  }

  notify() {
    this.deps.forEach((dep) => dep.update());
  }
}

// 监听
class Watcher {
  constructor(vm, key, cb) {
    this.vm = vm;
    this.key = key;
    this.cb = cb;

    // 将当前watcher实例指定到Dep静态属性target
    Dep.target = this;
    this.vm[key]; // 触发getter，添加依赖
    Dep.target = null; // 置空，避免重复
  }

  update() {
    // console.log("属性更新了");
    this.cb.call(this.vm, this.vm[this.key]);
  }
}
