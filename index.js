var express = require("express"),
  app = new express();

app.set('port', (process.env.PORT || 5000));

app.use("/", express.static("public"));
app.use("/vendor", express.static("bower_components"));
app.use("/contracts", express.static("build/contracts"));

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
