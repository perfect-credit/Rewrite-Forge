import app from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`RewriteForge service running on port ${config.port}`);
});