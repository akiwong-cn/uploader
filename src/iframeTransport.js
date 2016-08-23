/**
 * iframe请求
 */
import {EventEmitter} from 'events'
import {noop, merge} from './util'

export class IframeTransport extends EventEmitter {
  constructor () {
    super();
    this._ifr = document.createElement('iframe');
    merge(this._ifr.style, {
      position: 'absolute',
      display: 'none',
      width: 0,
      height: 0
    });
    this._ifr.src = 'javascript:false;';
    this._ifr.name = `IframeTransport-${IframeTransport.guid++}`,
    this._form = null;
    this._response = null;
    document.body.appendChild(this._ifr);
    this._data = null;
  }
  /**
   * @param: {object} data 发送选项
   *     formData {array|function} 发送的formData（非FormData实例）
   *       只支持基本类型 
   *     fileInput {HTMLElement} input标签
   */
  send (data) {
    this._data = data;
    var form = this._form = document.createElement('form');
    var forms = [];
    if (data.formData) {
      if (typeof data.formData === 'function') {
        forms = data.formData();
      } else {
        forms = data.formData;
      }
    }
    forms.forEach( item => {
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
    this._ifr.appendChild(form);
    data.fileInput.name = data.field;
    merge(form, {
      action: data.url,
      target: this._ifr.name,
      method: 'post',
      enctype: 'multipart/form-data',
      encoding: 'multipart/form-data'
    });

    var onerror = () => {
      this.emit('error', e);
    };

    var onload = () => {
      try {
        this._response = this._ifr.contentDocument.body;
      } catch (e) {
      }
      this.emit('complete', this);

      if (this._ifr.detachEvent) {
        this._ifr.detachEvent('onload', onload);
        this._ifr.detachEvent('onerror', onerror);
      } else {
        this._ifr.onload = null;
        this._ifr.onerror = null;
      }
    };

    
    if (this._ifr.attachEvent) {
      this._ifr.attachEvent('onload', onload);
      this._ifr.attachEvent('onerror', onerror);
    } else {
      this._ifr.onload = onload;
      this._ifr.onerror = onerror;
    }
    form.submit();
    data.fileInput.name = inputClone.name;
    data.fileInput.setAttribute('form', inputClone.getAttribute('form'));
    inputClone.parentNode.replaceChild(data.fileInput, inputClone);
  }

  abort () {
    this._ifr.onload = null;
    this._ifr.removeChild(this._form);
    this._ifr = null;
  }
  getResponse () {
    return this._response;
  }
  getText () {
    // 不支持textContent的(ie6-8)使用innerText
    return this._response ? this._response.textContent || this._response.innerText : '';
  }
  getJson () {
    return JSON.parse(this.getText());
  }
}

IframeTransport.guid = 1;