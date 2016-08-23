/**
 * 默认xmlhttprequest请求
 */
import {EventEmitter} from 'events'
import {noop} from './util'

export class Transport extends EventEmitter {
  constructor () {
    super();
    this.xhr = new XMLHttpRequest();
    this._data = null;
  }

  _ajax (form) {
   var xhr = this.xhr;
    xhr.upload.onprocess = e => {
      this.emit('process', e);
    };
    xhr.onreadystatechange = e => {
      if (xhr.readyState !== 4 ) {
        return;
      }

      xhr.upload.onprogress = noop;
      xhr.onreadystatechange = noop;

      if (xhr.status >= 200 && xhr.status < 300 ) {
        this.emit('complete', xhr);
      } else {
        this.emit('error', xhr);
      }
    };
    xhr.send(form);
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
    // 默认为post请求async必须为true
    this.xhr.open(data.method || 'POST', data.url || '', true);
    this.xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    if (data.headers) {
      for (let header in data.headers) {
        this.xhr.setRequestHeader(header, data.headers[header]);
      }
    }
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
    this.xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    this.xhr.setRequestHeader('Content-Disposition', 'attachment; filename="' +
          encodeURI(data.filename) + '"');
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
    this.xhr.abort();
    this.emit('abort', this.xhr);
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
