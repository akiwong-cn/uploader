/**
 * @file uploader工厂
 */
import { merge } from './utils'
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
    if (option.chunk && support.chunk && !option.forceIframe) {
      uploader = new ChunkUploader(uploaderOption);
    } else if (support.xhr && !option.forceIframe) {
      uploader = new Uploader(uploaderOption);
    } else {
      uploaderOption.transport = getIframeTransport;
      uploader = new Uploader(uploaderOption);
      uploader._iframe = true;
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