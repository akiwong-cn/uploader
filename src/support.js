/**
 * support检测
 */
var Blob = window.Blob || window.WebKitBlob;
var supportXhr = !!window.FormData || (window.ProgressEvent && window.FileReader);

var supportChunk = supportXhr && (function checkChunk() {
  try {
    let blobpro = Blob.prototype;
    return !!(FormData && (blobpro.slice || blobpro.webkitSlice || blobpro.mozSlice));
  } catch (e) {
    return false;
  }
}());

export default {
  xhr: supportXhr,
  chunk: supportChunk
};