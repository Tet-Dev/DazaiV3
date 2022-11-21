import type fetch from "node-fetch";
export { RequestInit } from "node-fetch"; // TODO: add more exports as needed here

// eslint-disable-next-line no-eval
const fetchPromise: Promise<typeof fetch> = eval('import("node-fetch")').then(
  (mod: { default: typeof fetch }) => mod.default
);
//@ts-ignore
const nfetch: typeof fetch = (...args) =>
  fetchPromise
    .then((fetch) => fetch(...args))
    .catch((er) => {
      console.trace(er, { args });
      throw er;
    });
export default nfetch;
