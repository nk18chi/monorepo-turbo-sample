import express from 'express';

const app = express();

app.get('/', (req, res) => res.send('Express on Vercel2'));

app.listen(5002, () => console.log('Server ready on port 5002.'));

export default app;
