(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.FileUploader = global.FileUploader || {})));
}(this, (function (exports) { 'use strict';

function noop() {}

function merge(target) {
  for (var _len = arguments.length, list = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    list[_key - 1] = arguments[_key];
  }

  for (var i = 0, l = list.length; i < l; i++) {
    for (var item in list[i]) {
      target[item] = list[i][item];
    }
  }
  return target;
}

function thenable(p) {
  return p && typeof p.then === 'function';
}

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
var events = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function (n) {
  if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function (type) {
  var er, handler, len, args, i, listeners;

  if (!this._events) this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error || isObject(this._events.error) && !this._events.error.length) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
          // At least give some kind of context to the user
          var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
          err.context = er;
          throw err;
        }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler)) return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++) {
      listeners[i].apply(this, args);
    }
  }

  return true;
};

EventEmitter.prototype.addListener = function (type, listener) {
  var m;

  if (!isFunction(listener)) throw TypeError('listener must be a function');

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener) this.emit('newListener', type, isFunction(listener.listener) ? listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' + 'leak detected. %d listeners added. ' + 'Use emitter.setMaxListeners() to increase limit.', this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function (type, listener) {
  if (!isFunction(listener)) throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function (type, listener) {
  var list, position, length, i;

  if (!isFunction(listener)) throw TypeError('listener must be a function');

  if (!this._events || !this._events[type]) return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener || isFunction(list.listener) && list.listener === listener) {
    delete this._events[type];
    if (this._events.removeListener) this.emit('removeListener', type, listener);
  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener || list[i].listener && list[i].listener === listener) {
        position = i;
        break;
      }
    }

    if (position < 0) return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener) this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function (type) {
  var key, listeners;

  if (!this._events) return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0) this._events = {};else if (this._events[type]) delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length) {
      this.removeListener(type, listeners[listeners.length - 1]);
    }
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function (type) {
  var ret;
  if (!this._events || !this._events[type]) ret = [];else if (isFunction(this._events[type])) ret = [this._events[type]];else ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function (type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener)) return 1;else if (evlistener) return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function (emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};











var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

/**
 * 文件类
 */

var File = function () {
  function File(file, name) {
    classCallCheck(this, File);

    this.id = File.guid++;
    this.source = file;
    this.name = name || file.name;
    this.size = file.size || 0;
    this.type = file.type || '';
    this.lastModified = file.lastModified;
    this.status = File.STATUS.UNUPLOAD;
    this.uploadedBytes = 0;
  }

  File.prototype.slice = function slice(start, end) {
    var slice = this.source.slice || this.source.mozSlice || this.source.webkitSlice;
    if (!slice) {
      return this.source;
    }
    return slice.call(this.source, start, end, this.type);
  };

  return File;
}();

File.STATUS = {
  UNUPLOAD: 1, // 未上传
  UPLOADING: 2, // 上传中
  CANCEL: 3, // 取消上传
  ERROR: 4, // 上传出错
  UPLOADED: 5 // 上传成功
};

File.guid = 1;

/**
 * 默认xmlhttprequest请求
 */
var Transport = function (_EventEmitter) {
  inherits(Transport, _EventEmitter);

  function Transport() {
    classCallCheck(this, Transport);

    var _this = possibleConstructorReturn(this, _EventEmitter.call(this));

    _this.xhr = new XMLHttpRequest();
    _this._data = null;
    return _this;
  }

  Transport.prototype._ajax = function _ajax(form) {
    var _this2 = this;

    var xhr = this.xhr;
    xhr.upload.onprogress = function (e) {
      _this2.emit('progress', e);
    };
    xhr.onreadystatechange = function (e) {
      if (xhr.readyState !== 4) {
        return;
      }

      xhr.upload.onprogress = noop;
      xhr.onreadystatechange = noop;

      if (xhr.status >= 200 && xhr.status < 300) {
        _this2.emit('complete', xhr);
      } else {
        _this2.emit('error', xhr);
      }
    };
    xhr.send(form);
  };
  /**
   * @param: {object} data 发送选项
   *     headers {object} 请求头
   *     binary {boolean} 使用二进制开发
   *     formData {array|function} 发送的formData（非FormData实例）
   *     field 文件表单名字
   *     name 文件名 如果为空使用file.name
   *     file 文件
   */


  Transport.prototype.send = function send(data) {
    this._data = data;
    // 默认为post请求async必须为true
    this.xhr.open(data.method || 'POST', data.url || '', true);
    // this.xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    if (data.headers) {
      for (var header in data.headers) {
        this.xhr.setRequestHeader(header, data.headers[header]);
      }
    }
    if (data.binary) {
      return this.sendAsBinary(data);
    } else {
      return this.sendAsFormData(data);
    }
  };

  /**
   * 使用二进制流发送
   * 不会自动处理formData 如果需传递参数请通过url
   */


  Transport.prototype.sendAsBinary = function sendAsBinary(data) {
    // 接收头为octet－stream
    this.xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    this.xhr.setRequestHeader('Content-Disposition', 'attachment; filename="' + encodeURI(data.filename) + '"');
    return this._ajax(data.file);
  };
  /**
   * 使用formdata发送 如果有formdata则会处理formData里面的数据
   */


  Transport.prototype.sendAsFormData = function sendAsFormData(data) {
    var forms;
    if (data.formData) {
      if (typeof data.formData === 'function') {
        forms = data.formData();
      } else {
        forms = data.formData;
      }
    }
    if (!forms) {
      forms = [];
    }
    var formData = new FormData();
    for (var i = 0, l = forms.length; i > l; i++) {
      var form = formData[i];
      formData.append(form.name, form.value);
    }
    if (data.file) {
      formData.append(data.field, data.file, data.name);
    }
    return this._ajax(formData);
  };

  Transport.prototype.abort = function abort() {
    this.xhr.abort();
    this.emit('abort', this.xhr);
  };

  Transport.prototype.getResponse = function getResponse() {
    return this.xhr.response;
  };

  Transport.prototype.getText = function getText() {
    return this.xhr.responseText;
  };

  Transport.prototype.getJson = function getJson() {
    return JSON.parse(this.xhr.responseText);
  };

  return Transport;
}(events);

/**
 * uploader 上传类, 上传队列目前实现顺序上传
 * @file: 上传类
 */
function before(cb) {
  cb();
}

var Uploader = function (_EventEmitter) {
  inherits(Uploader, _EventEmitter);

  function Uploader() {
    var option = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    classCallCheck(this, Uploader);

    var _this = possibleConstructorReturn(this, _EventEmitter.call(this));

    _this._iframe = false;
    _this.id = Uploader.guid++;
    _this.option = merge({
      beforeupload: before
    }, option);
    /**
     * 上传队列 
     * @type {Array}
     */
    _this.files = [];
    _this.status = Uploader.STATUS.UNSTART;
    _this.tr = null;
    _this._index = 0;
    return _this;
  }

  Uploader.prototype.setOption = function setOption(option) {
    if (option) {
      merge(this.option, option);
    }
  };

  Uploader.prototype.current = function current() {
    return this.files[this._index];
  };

  Uploader.prototype.start = function start() {
    this.emit('start', this);
    this.status = Uploader.STATUS.START;
    this.send();
  };

  /**
   * 暂停 只有当前文件上传完成才能暂停
   */


  Uploader.prototype.pause = function pause() {
    this.status = Uploader.STATUS.PAUSE;
  };

  Uploader.prototype.resume = function resume() {
    this.status = Uploader.STATUS.START;
    this.send();
  };

  Uploader.prototype.send = function send() {
    var _this2 = this;

    var fail = function (e) {
      _this2.emit('error', _this2, e);
    };
    var succ = function () {
      _this2._send();
    };
    var beforeFunc = function (error, data) {
      if (error) {
        return fail(error);
      }
      succ();
    };
    var result = this.option.beforeupload(beforeFunc);
    if (thenable(result)) {
      result.then(succ, fail);
    }
  };
  /**
   * 发送请求 目前只处理一个请求
   */


  Uploader.prototype._send = function _send() {
    var _this3 = this;

    if (this.status === Uploader.STATUS.PAUSE) {
      return this;
    }
    var file = this.files[this._index];
    this.tr = this.getTransport();

    file.status = File.STATUS.UPLOADING;

    var fail = function () {
      file.status = File.STATUS.ERROR;
      _this3.emit('error', _this3);
    };

    var success = function (r) {
      file.status = File.STATUS.UPLOADED;
      file.uploadBytes = file.size;
      _this3.emit('done', file);
      _this3._index++;
      if (_this3._index >= _this3.files.length) {
        _this3.status = Uploader.STATUS.COMPLETE;
        _this3.emit('complete', _this3, _this3.tr.getJson());
        return;
      }
      _this3.send();
    };
    this.tr.on('complete', success);
    this.tr.on('error', fail);
    this.tr.on('progress', function (e) {
      if (e.lengthComputable) {
        _this3.emit('progress', e);
      }
    });

    this.tr.send({
      formData: this.option.formData,
      url: this.option.url,
      binary: this.option.binary,
      field: this.option.filefield || 'file[]',
      name: file.name,
      file: file.source,
      fileInput: this.option.fileInput
    });
  };

  Uploader.prototype.abort = function abort() {
    if (this.tr) {
      this.tr.abort();
      this.emit('abort', this);
      this.status = Uploader.STATUS.PAUSE;
    }
  };

  Uploader.prototype.addFile = function addFile(file, name) {
    this.files.push(new File(file, name));
    this.emit('add', this.files[this.files.length - 1]);
  };

  Uploader.prototype.getTransport = function getTransport() {
    if (this.option.transport) {
      return this.option.transport(this.option);
    }
    return new Transport(this.option);
  };

  return Uploader;
}(events);

Uploader.STATUS = {
  UNSTART: 0, // 初始状态
  START: 1, // 开始状态还未上传
  UPLOADING: 2, // 上传中
  PAUSE: 3, // 上传暂停
  COMPLETE: 4, // 上传结束
  ABORT: 5 // 放弃上传
};

Uploader.guid = 1;

/**
 * @file chunk uploader 分块上传类
 */
/**
 * 分块上传类
 */

var ChunkUploader = function (_Uploader) {
  inherits(ChunkUploader, _Uploader);

  function ChunkUploader(option) {
    classCallCheck(this, ChunkUploader);

    var _this = possibleConstructorReturn(this, _Uploader.call(this, merge({
      chunkSize: 10 * 1024 * 1024
    }, option)));
    // 默认的chunksize 为 10m


    _this.chunked = true;
    return _this;
  }

  ChunkUploader.prototype._send = function _send() {
    var _this2 = this;

    if (this.status === Uploader.STATUS.PAUSE) {
      return this;
    }
    var file = this.files[this._index];
    this.tr = this.getTransport();
    file.status = File.STATUS.UPLOADING;

    var chunkSize = this.option.chunkSize || file.size;
    var end = file.uploadedBytes + chunkSize;
    if (end > file.size) {
      chunkSize = file.size - file.uploadedBytes;
      end = file.size;
    }
    var fail = function () {
      file.status = File.STATUS.ERROR;
      _this2.emit('error', _this2);
    };

    var success = function (r) {
      if (end < file.size) {
        _this2.emit('chunkdone', _this2);
        file.uploadedBytes = end;
        return _this2.send();
      }
      file.status = File.STATUS.UPLOADED;
      _this2.emit('chunkdone', _this2);
      _this2.emit('done', _this2);
      _this2._index++;
      if (_this2._index >= _this2.files.length) {
        _this2.status = Uploader.STATUS.COMPLETE;
        _this2.emit('complete', _this2, _this2.tr.getJson());
        return;
      }
      _this2.send();
    };

    this.tr.on('complete', success);

    this.tr.on('error', fail);

    this.tr.on('progress', function (e) {
      if (e.lengthComputable) {
        _this2.emit('progress', {
          lengthComputable: e.lengthComputable,
          loaded: e.loaded + file.uploadedBytes,
          total: file.size
        });
      }
    });

    // only support xhr2 uploader
    this.tr.send({
      headers: {
        'Content-Range': 'bytes ' + file.uploadedBytes + '-' + (end - 1) + '/' + file.size
      },
      formData: this.option.formData,
      url: this.option.url,
      binary: this.option.binary,
      field: this.option.filefield || 'file[]',
      name: file.name,
      file: file.slice(file.uploadedBytes, end),
      fileInput: this.option.input
    });
  };

  return ChunkUploader;
}(Uploader);

Uploader.STATUS = {
  UNSTART: 0, // 初始状态
  START: 1, // 开始状态还未上传
  UPLOADING: 2, // 上传中
  PAUSE: 3, // 上传暂停
  COMPLETE: 4 // 上传结束
};

/**
 * iframe请求
 */
// ie7以下由于设置不了所以使用这种方式创建iframe
function createIframe(name) {
  var div = document.createElement('div');
  div.innerHTML = '<iframe name="' + name + '" src="javascript:false"></iframe>';
  return div.children[0];
}

function on(iframe, type, fn) {
  if (iframe.attachEvent) {
    iframe.attachEvent(type, fn);
  } else {
    iframe[type] = fn;
  }
}

function off(iframe, type, fn) {
  if (iframe.attachEvent) {
    iframe.detachEvent(type, fn);
  } else {
    iframe[type] = null;
  }
}

/**
 * iframe 发送表单
 */

var IframeTransport = function (_EventEmitter) {
  inherits(IframeTransport, _EventEmitter);

  function IframeTransport() {
    classCallCheck(this, IframeTransport);

    var _this = possibleConstructorReturn(this, _EventEmitter.call(this));

    _this._ifr = createIframe('IframeTransport-' + IframeTransport.guid++);
    merge(_this._ifr.style, {
      position: 'absolute',
      display: 'none',
      width: 0,
      height: 0
    });

    _this._form = null;
    _this._response = null;
    _this._data = null;
    return _this;
  }

  IframeTransport.prototype.send = function send(data) {
    var _this2 = this;

    var onsend = function () {
      off(_this2._ifr, 'onload', onsend);
      _this2._send(data);
    };
    on(this._ifr, 'onload', onsend);
    document.body.appendChild(this._ifr);
  };
  /**
   * @param: {object} data 发送选项
   *     formData {array|function} 发送的formData（非FormData实例）
   *       只支持基本类型 
   *     fileInput {HTMLElement} input标签
   */


  IframeTransport.prototype._send = function _send(data) {
    var _this3 = this;

    this._data = data;
    var form = this._form = document.createElement('form');
    form.style.display = 'none';

    var forms = [];
    if (data.formData) {
      if (typeof data.formData === 'function') {
        forms = data.formData();
      } else {
        forms = data.formData;
      }
    }
    forms.forEach(function (item) {
      var input = document.createElement('input');
      merge(input, {
        type: 'hidden',
        name: item.name,
        value: item.value
      });
      form.appendChild(input);
    });

    var inputClone = data.fileInput.cloneNode(true);
    data.fileInput.parentNode.insertBefore(inputClone, data.fileInput);
    inputClone.removeAttribute('form');
    form.appendChild(data.fileInput);
    form.appendChild(this._ifr);
    document.body.appendChild(form);

    data.fileInput.name = data.field;
    merge(form, {
      action: data.url,
      target: this._ifr.name,
      method: 'post',
      enctype: 'multipart/form-data',
      encoding: 'multipart/form-data'
    });
    data.fileInput.removeAttribute('form');

    var onerror = function () {
      _this3.emit('error', e);
      document.body.removeChild(_this3._ifr);
    };

    var onload = function () {
      try {
        var doc = _this3._ifr.contentDocument;
        if (!doc) {
          // for ie
          doc = _this3._ifr.contentWindow.document;
        }
        var response = doc.body;
        // 不支持textContent的(ie6-8)使用innerText
        _this3._response = response.innerText || response.textContent;
      } catch (e) {}
      document.body.removeChild(form);
      _this3.emit('complete', _this3);
    };

    on(this._ifr, 'onload', onload);
    on(this._ifr, 'onerror', onerror);

    form.submit();
    data.fileInput.name = inputClone.name;
    var formAttr = inputClone.getAttribute('form');
    if (formAttr) {
      data.fileInput.setAttribute('form', formAttr);
    }
    inputClone.parentNode.replaceChild(data.fileInput, inputClone);
  };

  IframeTransport.prototype.abort = function abort() {
    this._ifr.onload = null;
    this._ifr.removeChild(this._form);
    this._ifr = null;
  };

  IframeTransport.prototype.getResponse = function getResponse() {
    return this._response;
  };

  IframeTransport.prototype.getText = function getText() {
    return this._response || '';
  };

  IframeTransport.prototype.getJson = function getJson() {
    try {
      return JSON.parse(this.getText());
    } catch (e) {}
    return null;
  };

  return IframeTransport;
}(events);

IframeTransport.guid = 1;

/**
 * support检测
 */
var Blob = window.Blob || window.WebKitBlob;
var supportXhr = !!window.FormData || window.ProgressEvent && window.FileReader;

var supportChunk = supportXhr && function checkChunk() {
  try {
    var blobpro = Blob.prototype;
    return !!(FormData && (blobpro.slice || blobpro.webkitSlice || blobpro.mozSlice));
  } catch (e) {
    return false;
  }
}();

var support = {
  xhr: supportXhr,
  chunk: supportChunk
};

/**
 * @file uploader工厂
 */
function getIframeTransport(option) {
  return new IframeTransport(option);
}

var Factory = function () {
  function Factory() {
    classCallCheck(this, Factory);
  }

  Factory.prototype.getUploader = function getUploader() {
    var option = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var uploaderOption = merge({}, Factory.defaultOption, option);
    var uploader = null;
    // 同时发送多个文件 不能使用chunkuploader
    if (option.chunk && support.chunk && !option.forceIframe) {
      uploader = new ChunkUploader(uploaderOption);
    } else if (support.xhr && !option.forceIframe) {
      uploader = new Uploader(uploaderOption);
    } else {
      uploaderOption.transport = getIframeTransport;
      uploader = new Uploader(uploaderOption);
      uploader._iframe = true;
    }
    return uploader;
  };

  return Factory;
}();

Factory.defaultOption = {
  chunk: false,
  multiSend: false,
  forceIframe: false
};

exports.Factory = Factory;
exports.ChunkUploader = ChunkUploader;
exports.Uploader = Uploader;
exports.support = support;

Object.defineProperty(exports, '__esModule', { value: true });

})));
