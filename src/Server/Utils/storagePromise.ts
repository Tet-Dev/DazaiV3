import { Storage } from '@google-cloud/storage';
export const storagePromise = new Storage({
  credentials: env.google,
});
export default storagePromise;
