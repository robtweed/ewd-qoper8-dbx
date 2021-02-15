/*

 ----------------------------------------------------------------------------
 | ewd-qoper8-dbx: Integrates Cache, IRIS or YottaDB via mg_dbx with        |
 |                    ewd-qpoper8 worker modules                            |
 |                                                                          |
 | Copyright (c) 2019-21 M/Gateway Developments Ltd,                        |
 | Redhill, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  15 February 2021

*/

module.exports = function(worker, params) {

  //console.log('ewd-qoper8-dbx/lib/dbx - params = ' + JSON.stringify(params, null, 2));

  var DocumentStore = require('ewd-document-store');
  var qewd_mg_dbx = require('qewd-mg-dbx');
  var options = {
    database: {}
  };
  params = params || {};
  options.database.type = params.database || 'YottaDB';
  if (options.database.type === 'YottaDB') {
    options.database.release = params.release || 'r1.30';
    options.database.architecture = params.architecture || 'x86';
  }
  if (options.database.type === 'IRIS' || options.database.type === 'Cache') {
    options.database.path = params.path || '/opt/iris/mgr';
    options.database.username = params.username || '_SYSTEM';
    options.database.password = params.password || 'SYS';
    options.database.namespace = params.namespace || 'USER';
    if (params.host) {
      delete options.database.path;
      options.database.host = params.host;
      options.database.tcp_port = params.tcp_port;
    }
  }
  if (options.database.type === 'bdb') options.database.type = 'BDB';
  if (options.database.type === 'BDB') {
    options.database.db_library = params.db_library || "/usr/local/BerkeleyDB.18.1/lib/libdb.so";
    options.database.db_file = params.db_file || "/opt/bdb/globals.db";
    options.database.env_dir = params.env_dir || "/opt/bdb";
    options.database.key_type = "m";
  }

  if (params.multithreaded) {
    options.database.multithreaded = true;
  }

  console.log(options);
  worker.db = new qewd_mg_dbx(options);
  var status = worker.db.open();

  worker.on('stop', function() {
    console.log('***** worker signalled to stop');
    this.db.close();
    worker.emit('dbClosed');
  });

  worker.on('unexpectedError', function() {
    if (worker.db) {
      try {
        worker.db.close();
      }
      catch(err) {
        // ignore - process will shut down anyway
      }
    }
  });

  worker.emit('dbOpened', status);
  worker.documentStore = new DocumentStore(worker.db);
  worker.emit('DocumentStoreStarted');
};

