/**
 * 默认xmlhttprequest请求
 */
import EventEmitter from 'events'
import { noop } from './utils'

export default class Transport extends EventEmitter {
  constructor () {
    super();
    this.xhr = new XMLHttpRequest();
    this._data = null;
    this._reqHeaders = null;
  }

  _ajax (form) {
    let headers = this._reqHeaders;
    if (headers) {
      for (let header in headers) {
        if (headers[header] !== undefined) {
          this.xhr.setRequestHeader(header, headers[header]);
        }
      }
    }
    var xhr = this.xhr;
    xhr.upload.onprogress = e => {
      this.emit('progress', e);
    };
    this.xhr.onerror = e => {
      this.callback('error', e);
    };
    this.xhr.onabort = e => {
      this.callback('abort', e);
    };
    xhr.onreadystatechange = e => {
      if (xhr.readyState !== 4 ) {
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300 ) {
        this.callback('complete', e);
      } else {
        this.callback('error', e);
      }
    };
    xhr.send(form);
  }

  /**
   * first set has higher priority
   *
   * @param {object} headers
   */
  _mergeHeader(headers) {
    for (let header in headers) {
      if (!this._reqHeaders[header]) {
        this._reqHeaders[header] = headers[header];
      }
    }
  }
  /**
   * @param: {object} data 发送选项
   *     headers {object} 请求头
   *     binary {boolean} 使用二进制开发
   *     formData {array|function} 发送的formData（非FormData实例）
   *     field 文件表单名字
   *     name 文件名 如果为空使用file.name
   *     file 文件
   */
  send (data) {
    this._data = data;
    this._reqHeaders = data.headers || {};
    // 默认为post请求async必须为true
    this.xhr.open(data.method || 'POST', data.url || '', true);
    this._mergeHeader({ 'X-Requested-With': 'XMLHttpRequest' });
    if (data.binary) {
      return this.sendAsBinary(data);
    } else {
      return this.sendAsFormData(data);
    }
  }

  /**
   * 使用二进制流发送
   * 不会自动处理formData 如果需传递参数请通过url
   */
  sendAsBinary (data) {
    // 接收头为octet－stream
    this._mergeHeader({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="' + encodeURI(data.filename) + '"'
    });
    return this._ajax(data.file);
  }
  /**
   * 使用formdata发送 如果有formdata则会处理formData里面的数据
   */
  sendAsFormData (data) {
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
    for (let i = 0, l = forms.length; i > l; i++) {
      let form = formData[i];
      formData.append(form.name, form.value);
    }
    if (data.file) {
      formData.append(data.field, data.file, data.name);
    }
    return this._ajax(formData);
  }

  abort () {
    this.xhr.onreadystatechange = null;
    this.xhr.abort();
  }
  callback(type, e) {
    let x = this.xhr;
    x.onreadystatechange = x.upload.onerror = x.onprogress = x.onabort = null;
    this.emit(type, e);
  }
  getResponse () {
    return this.xhr.response;
  }
  getText () {
    return this.xhr.responseText;
  }
  getJson () {
    return JSON.parse(this.xhr.responseText);
  }
}
