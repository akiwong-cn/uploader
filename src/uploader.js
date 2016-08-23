/**
 * uploader 上传类, 上传队列目前实现顺序上传
 * @file: 上传类
 */
import { EventEmitter } from 'events'
import { noop, merge, thenable } from './util'
import { File } from './file'
import { Transport } from './transport'

export class Uploader extends EventEmitter {
  constructor(option = {}) {
    super()
    this.option = merge({
      upload: noop
    }, option);
    /**
     * 上传队列 
     * @type {Array}
     */
    this.queue = [];
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
    return this.queue[this._index];
  }

  start() {
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
    let result = this.option.upload();
    if (thenable(result)) {
      result.then(() => {
        this._send();
      }, () => {
        this.emit('error', this);
      });
    } else {
      this._send();
    }
  }
  /**
   * 发送请求 目前只处理一个请求
   */
  _send() {
    if (this.status === Uploader.STATUS.PAUSE) {
      return this;
    }
    let file = this.queue[this._index];
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
      if (this._index >= this.queue.length) {
        this.status = Uploader.STATUS.COMPLETE;
        this.emit('complete', this);
        return;
      }
      this.send();
    };
    this.tr.on('complete', success);
    this.tr.on('error', fail);

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
    }
  }

  addFile(file, name) {
    this.queue.push(new File(file, name));
    this.emit('add', this.queue[this.queue.length - 1]);
  }

  getTransport() {
    if (this.option.transport) {
      return transport(this.option);
    }
    return new Transport(this.option);
  }
}

Uploader.STATUS = {
  UNSTART: 0, // 初始状态
  START: 1, // 开始状态还未上传
  UPLOADING: 2, // 上传中
  PAUSE: 3, // 上传暂停
  COMPLETE: 4 // 上传结束
};