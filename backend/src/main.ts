import { createApp } from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3333;

const app = createApp();
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`SGST backend running on http://localhost:${PORT}`);
});

