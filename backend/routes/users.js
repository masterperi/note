const express = require('express');
const app = express();
const userRoutes = require('./routes/user'); // path to the file you posted

app.use('/users', userRoutes); // Now GET /users will respond "User route working"

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
