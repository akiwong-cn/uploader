export class File {
  constructor(file, name) {
    this.id = File.guid++;
    this.source = file;
    this.name = name || file.name;
    this.size = file.size || 0;
    this.type = file.type || '';
    this.lastModified = file.lastModified;
    this.status =  File.STATUS.UNUPLOAD;
    this.uploadedBytes = 0;
  }

  slice(start, end) {
    var slice = this.source.slice || this.source.mozSlice || this.source.webkitSlice;
    if (!slice) {
      return this.source;
    }
    return slice.call(this.source, start, end);
  }
}

File.STATUS = {
  UNUPLOAD: 1, // 未上传
  UPLOADING: 2, // 上传中
  CANCEL: 3, // 取消上传
  ERROR: 4, // 上传出错
  UPLOADED: 5 // 上传成功
};

File.guid = 1;