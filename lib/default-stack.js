const fs = require("fs");
const path = require("path");
const EventEmitter = require('events')
const slash = require('slash');

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
      const url = new URL(ctx.request.href);
      let pathname = url.pathname;
      
      let logicalPathName = pathname; // that will pass along to fetch the resource (via next())

      if (logicalPathName.startsWith('/ipfs/')) {
        if (!config.only || config.only === "hash") {
          const hashSlashIndex = logicalPathName.substr(6).indexOf("/");
          if (hashSlashIndex === -1) {
            logicalPathName = "/"
          } else {
            logicalPathName = logicalPathName.slice(hashSlashIndex+6);
          }
        } else {
          return replyWith404(ctx);
        }
      } else {
        if (ctx.request.header) {
          const referer = ctx.request.header.referer;
          if (referer) {
            const refererURL = new URL(referer);
            if (refererURL.pathname.startsWith("/ipfs/")) {
              return replyWith404(ctx, "Not Found (referer)");
            }
          }
        }
        if (config.only && config.only === "hash") {
          return replyWith404(ctx);
        }
      }
      
      let filepath = logicalPathName.length > 0 ? logicalPathName.slice(1) : logicalPathName;
      if (config.directory) {
        filepath = path.join(config.directory, filepath);
      }
      
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
          const length = pathname.length;
          if (length == 0) {
            pathname = "/"
          } else if (pathname[length - 1] != "/") {
            pathname += "/";
          }
          if (pathname !== url.pathname) {
            console.log('redirecting to ' + pathname);
            ctx.redirect(pathname);
          } else {
            ctx.request.url = logicalPathName;
          }
        } else {
          ctx.request.url = logicalPathName;
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
