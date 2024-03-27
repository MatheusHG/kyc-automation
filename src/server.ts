
import app from './app';
import globalConfig from './config/global-config';

const expressPort = globalConfig.port();

app.listen(expressPort, () => {
  console.log(`🚀 Server is running on http://localhost:${expressPort}.`);
});