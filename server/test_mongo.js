const mongoose = require('mongoose');
const uri = "mongodb+srv://yuvrajsinghkaushik_db_user:Outdated1607@dormify.ixonwd5.mongodb.net/dormify?retryWrites=true&w=majority&appName=Dormify";

mongoose.connect(uri)
  .then(() => {
    console.log("SUCCESS");
    process.exit(0);
  })
  .catch((err) => {
    console.error("ERROR", err.message);
    process.exit(1);
  });
