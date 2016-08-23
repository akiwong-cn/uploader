/**
 * @file chunk uploader 分块上传类
 */
import {Uploader} from './uploader'
import {noop, merge, thenable} from './util'
import {File} from './file'
import {Transport} from './transport'

export class ChunkUploader extends Uploader {
  constructor(option) {
    // 默认的chunksize 为 10m
    super(merge({
      chunkSize: 10 * 1024 * 1024
    }, option));
  }
  _send() {
    if (this.status === Uploader.STATUS.PAUSE) {
      return this;
    }
    let file = this.queue[this._index];
    this.tr = this.getTransport();
    file.status = File.STATUS.UPLOADING;

    let chunkSize = this.option.chunkSize;
    let end = file.uploadedBytes + chunkSize;
    if (end > file.size) {
      chunkSize = file.size - file.uploadedBytes;
      end = file.size;
    }
    let fail = () => {
      file.status = File.STATUS.ERROR;
      this.emit('error', this);
    }

    let success = r => {
      if (end < file.size) {
        this.emit('chunkdone', this);
        file.uploadedBytes = end;
        return this.send();
      }
      file.status = File.STATUS.UPLOADED;
      this.emit('chunkdone', this);
      this.emit('done', file);
      this._index++;
      if (this._index >= this.queue.length) {
        this.status = Uploader.STATUS.COMPLETE;
        this.emit('complete', this);
        return;
      }
      this.send();
    }

    // option.upload 是对chunk 上传的回调
    this.tr.on('complete', success);

    this.tr.on('error', fail);
    // only support xhr2 uploader
    this.tr.send({
      headers: {
        'Content-Range': `bytes ${file.uploadedBytes}-${end - 1}/${file.size}` 
      },
      formData: this.option.formData,
      url: this.option.url,
      binary: this.option.binary,
      field: this.option.filefield || 'file[]',
      name: file.name,
      file: file.slice(file.uploadedBytes, end),
      fileInput: this.option.input
    });
  }
}

Uploader.STATUS = {
  UNSTART: 0, // 初始状态
  START: 1, // 开始状态还未上传
  UPLOADING: 2, // 上传中
  PAUSE: 3, // 上传暂停
  COMPLETE: 4 // 上传结束
};