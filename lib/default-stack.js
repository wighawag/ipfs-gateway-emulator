const fs = require("fs");
const path = require("path");
const EventEmitter = require('events')
const slash = require('slash');

function breakURL(url) {
  const doubleSLashIndex = url.indexOf("//");
  let protocol;
  let urlWithoutProtocol;
  if (doubleSLashIndex >= 0) {
    urlWithoutProtocol = url.slice(doubleSLashIndex+2);
    protocol = url.slice(0, doubleSLashIndex + 2);
  } else {
    urlWithoutProtocol = url;
    protocol = "";
  }
  const firsSlashIndex = urlWithoutProtocol.indexOf("/");
  const host = protocol + urlWithoutProtocol.slice(0,firsSlashIndex);
  let pathname = "";
  if (firsSlashIndex !== -1) {
    pathname = urlWithoutProtocol.slice(firsSlashIndex+1);
  }
  return {urlWithoutProtocol, protocol, host, pathname};
}

function replyWith404(ctx, message) {
  ctx.body = message || "Not Found";
  ctx.status= 404;
  ctx.message = message || "Not Found";
}
class TrailingSlash extends EventEmitter {
  description () {
    return 'Mimic ipfs gateway behavior'
  }

  optionDefinitions () {
    return [
      {
        name: 'only',
        type: String,
        description: 'to only enable "root" or "hash" ("/ipfs/<hash>/") base path'
      },
    ]
  }

  middleware (config) {
    return async function (ctx, next) {
      // console.log(JSON.stringify(ctx.request, null, '  '));
      let redirectToUrl = ctx.request.href;
      const {
        host,
        pathname
      } = breakURL(redirectToUrl);

      let urlpath = pathname;
      if (urlpath.startsWith('ipfs/')) {
        if (!config.only || config.only === "hash") {
          const hashSlashIndex = urlpath.substr(5).indexOf("/")+ 5;
          urlpath = urlpath.slice(hashSlashIndex+1);
        } else {
          return replyWith404(ctx);
        }
      } else {
        if (ctx.request.header) {
          const referer = ctx.request.header.referer;
          if (referer) {
            const {
              pathname: refererPathName
            } = breakURL(referer);
            if (refererPathName.startsWith("ipfs/")) {
              return replyWith404(ctx, "Not Found (referer)");
            }
          }
        }
        if (config.only && config.only === "hash") {
          return replyWith404(ctx);
        }
      }
      
      let filepath = urlpath;
      if (config.directory) {
        filepath = path.join(config.directory, filepath);
      }
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
          const length = redirectToUrl.length;
          if (length == 0) {
              redirectToUrl = "/"
          } else if (redirectToUrl[length - 1] != "/") {
              redirectToUrl += "/";
          }
          if (redirectToUrl !== ctx.request.href) {
              ctx.redirect(redirectToUrl)
          } else {
            const newUrl = host + "/" + slash(urlpath);
            ctx.request.url = newUrl;
          }
        } else {
          const newUrl = host + "/" + slash(urlpath);
          ctx.request.url = newUrl;
        }
      }
      await next()
    }
  }
}


module.exports = [
  TrailingSlash,
  'static',
  'index'
]
