var express = require("express"),
  app = new express();

app.set('port', (process.env.PORT || 5000));

app.use("/ui", express.static("ui"));
app.use("/contracts", express.static("build/contracts"));

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
