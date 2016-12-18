/**
 * @file uploader工厂
 */
import { merge } from './util'
import ChunkUploader from './chunkUploader'
import Uploader from './uploader'
import IframeTransport from './iframeTransport'


var Blob = window.Blob || window.WebKitBlob;
var supportXhr = !!window.FormData || (window.ProgressEvent && window.FileReader);

var supportChunk = supportXhr && (function checkChunk() {
  try {
    let blobpro = Blob.prototype;
    return FormData && (blobpro.slice || blobpro.webkitSlice);
  } catch (e) {
    return false;
  }
});

function getIframeTransport(option) {
  return new IframeTransport(option);
}

class Factory {
  getUploader(option = {}) {
    var uploaderOption = merge({}, Factory.defaultOption, option);
    var uploader = null;
    // 同时发送多个文件 不能使用chunkuploader
    if (option.chunk && supportChunk) {
      uploader = new ChunkUploader(uploaderOption);
    } else if (supportXhr) {
      uploader = new Uploader(uploaderOption);
    } else {
      uploader = uploaderOption.transport = getIframeTransport;
    }
    return uploader;
  }
}

Factory.defaultOption = {
  chunk: false,
  multiSend: false,
  forceIframe: false
};

export default Factory;