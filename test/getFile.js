var BlobBuilder = window.BlobBuilder || window.MozBlobBuilder || window.WebkitBlobBuilder || window.MSBlobBuilder
console.log(BlobBuilder)
export default function (content, type) {
  if (BlobBuilder) {
    var b = new BlobBuilder();
    b.append(content);
    return b.getBlob(type);
  } else {
    return new File(content, { type });
  }

}