/**
 * uploader 上传类, 上传队列目前实现顺序上传
 * @file: 上传类
 */
import { EventEmitter } from 'events'
import { merge, thenable } from './util'
import File from './file'
import Transport from './transport'
function before(cb) {
  cb();
}
export default class Uploader extends EventEmitter {
  constructor(option = {}) {
    super();
    this.id = Uploader.guid++;
    this.option = merge({
      beforeupload: before
    }, option);
    /**
     * 上传队列 
     * @type {Array}
     */
    this.files = [];
    this.status = Uploader.STATUS.UNSTART;
    this.tr = null;
    this._index = 0;
  }

  setOption(option) {
    if (option) {
      merge(this.option, option);
    }
  }

  current() {
    return this.files[this._index];
  }

  start() {
    this.emit('start', this);
    this.status = Uploader.STATUS.START;
    this.send();
  }

  /**
   * 暂停 只有当前文件上传完成才能暂停
   */
  pause() {
    this.status = Uploader.STATUS.PAUSE;
  }

  resume() {
    this.status = Uploader.STATUS.START;
    this.send();
  }
  send() {
    let fail = (e) => {
      this.emit('error', this, e);
    };
    let succ = () => {
      this._send();
    };
    let beforeFunc = (error, data) => {
      if (error) {
        return fail(error);
      }
      succ();
    }
    let result = this.option.beforeupload(beforeFunc);
    if (thenable(result)) {
      result.then(succ, fail);
    }
  }
  /**
   * 发送请求 目前只处理一个请求
   */
  _send() {
    if (this.status === Uploader.STATUS.PAUSE) {
      return this;
    }
    let file = this.files[this._index];
    this.tr = this.getTransport();

    file.status = File.STATUS.UPLOADING;

    let fail = () => {
      file.status = File.STATUS.ERROR;
      this.emit('error', this);
    }

    let success = r => {
      file.status = File.STATUS.UPLOADED;
      file.uploadBytes = file.size;
      this.emit('done', file);
      this._index++;
      if (this._index >= this.files.length) {
        this.status = Uploader.STATUS.COMPLETE;
        this.emit('complete', this, this.tr.getJson());
        return;
      }
      this.send();
    };
    this.tr.on('complete', success);
    this.tr.on('error', fail);
    this.tr.on('progress', (e) => {
      if (e.lengthComputable) {
        this.emit('progress', e);
      }
    });

    this.tr.send({
      formData: this.option.formData,
      url: this.option.url,
      binary: this.option.binary,
      field: this.option.filefield || 'file[]',
      name: file.name,
      file: file.source,
      fileInput: this.option.input
    });
  }

  abort() {
    if (this.tr) {
      this.tr.abort();
      this.emit('abort', this);
      this.status = Uploader.STATUS.PAUSE;
    }
  }

  addFile(file, name) {
    this.files.push(new File(file, name));
    this.emit('add', this.files[this.files.length - 1]);
  }

  getTransport() {
    if (this.option.transport) {
      return this.option.transport(this.option);
    }
    return new Transport(this.option);
  }
}

Uploader.STATUS = {
  UNSTART: 0, // 初始状态
  START: 1, // 开始状态还未上传
  UPLOADING: 2, // 上传中
  PAUSE: 3, // 上传暂停
  COMPLETE: 4, // 上传结束
  ABORT: 5  // 放弃上传
};

Uploader.guid = 1;