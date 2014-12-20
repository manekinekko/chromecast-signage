var nodecastor = require('nodecastor');
var util = require('util');
nodecastor.scan()
  .on('online', function(d) {
    console.log('New device', d.friendlyName);

    d.application('YouTube', function(err, a) {
		  if (!err) {
		    console.log('YouTube application', util.inspect(a));
		  }

		  a.run('urn:x-cast:com.google.cast.receiver', function(err, s) {
			  if (!err) {
			    console.log('Got a session', util.inspect(s));
			  }
			});

		});


  })
  .on('offline', function(d) {
    console.log('Removed device', util.inspect(d));
  })
  .start();