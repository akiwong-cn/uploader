/**
 * @file uploader工厂
 */
import { merge } from './util'
import ChunkUploader from './chunkUploader'
import Uploader from './uploader'
import IframeTransport from './iframeTransport'
import support from './support';



function getIframeTransport(option) {
  return new IframeTransport(option);
}

class Factory {
  getUploader(option = {}) {
    var uploaderOption = merge({}, Factory.defaultOption, option);
    var uploader = null;
    // 同时发送多个文件 不能使用chunkuploader
    if (option.chunk && support.chunk) {
      uploader = new ChunkUploader(uploaderOption);
    } else if (support.xhr) {
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