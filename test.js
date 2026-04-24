console.log("HELLO FROM TEST");
import express from 'express';
const app = express();
app.get('/', (req, res) => res.send("TEST"));
app.listen(8080, () => console.log("TEST READY"));