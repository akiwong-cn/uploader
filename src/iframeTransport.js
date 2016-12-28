/**
 * iframe请求
 */
import EventEmitter from 'events'
import { noop, merge } from './utils'

// ie7以下由于设置不了所以使用这种方式创建iframe
function createIframe(name) {
  var div = document.createElement('div');
  div.innerHTML = `<iframe name="${name}" src="javascript:false"></iframe>`;
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
export default class IframeTransport extends EventEmitter {
  constructor () {
    super();
    this._ifr = createIframe(`IframeTransport-${IframeTransport.guid++}`);
    merge(this._ifr.style, {
      position: 'absolute',
      display: 'none',
      width: 0,
      height: 0
    });
    
    this._form = null;
    this._response = null;
    this._data = null;
  }
  send(data) {
    var onsend = () => {
      off(this._ifr, 'onload', onsend);
      this._send(data);
    }
    on(this._ifr, 'onload', onsend);
    document.body.appendChild(this._ifr);
  }
  /**
   * @param: {object} data 发送选项
   *     formData {array|function} 发送的formData（非FormData实例）
   *       只支持基本类型 
   *     fileInput {HTMLElement} input标签
   */
  _send (data) {
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

    var onerror = () => {
      this.emit('error', e);
      document.body.removeChild(this._ifr);
    };

    var onload = () => {
      try {
        var doc = this._ifr.contentDocument;
        if (!doc) {
          // for ie
          doc = this._ifr.contentWindow.document;
        }
        var response = doc.body;
        // 不支持textContent的(ie6-8)使用innerText
        this._response = response.innerText || response.textContent;
      } catch (e) {
      }
      document.body.removeChild(form);
      this.emit('complete', this);
    };

    on(this._ifr, 'onload', onload);
    on(this._ifr, 'onerror', onerror);

    form.submit();
    data.fileInput.name = inputClone.name;
    let formAttr = inputClone.getAttribute('form');
    if (formAttr) {
      data.fileInput.setAttribute('form', formAttr);
    }
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
    return this._response || '';
  }
  getJson () {
    try {
      return JSON.parse(this.getText());
    } catch (e) {}
    return null;
  }
}

IframeTransport.guid = 1;