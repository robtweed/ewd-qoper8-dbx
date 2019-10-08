/*

 ----------------------------------------------------------------------------
 | ewd-qoper8-dbx: Integrates Cache, IRIS or YottaDB via mg_dbx with        |
 |                    ewd-qpoper8 worker modules                            |
 |                                                                          |
 | Copyright (c) 2019 M/Gateway Developments Ltd,                           |
 | Reigate, Surrey UK.                                                      |
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

*/

module.exports = function(worker, params) {

  var DocumentStore = require('ewd-document-store');
  var qewd_mg_dbx = require('qewd-mg-dbx');
  var options = {
    database: {}
  };
  params = params || {};
  options.database.type = params.database || 'YottaDB';
  if (options.database.type === 'YottaDB') {
    options.database.release = params.release || 'r1.28';
    options.database.architecture = params.architecture || 'x86';
  }
  if (options.database.type === 'IRIS' || options.database.type === 'Cache') {
    options.database.path = params.path || '/opt/iris/mgr';
    options.database.username = params.username || '_SYSTEM';
    options.database.password = params.password || 'SYS';
    options.database.namespace = params.namespace || 'USER';
  }

  worker.db = new qewd_mg_dbx(options);
  var status = worker.db.open();

  worker.on('stop', function() {
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

