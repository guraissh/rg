const Logger = {
  captureException(url, e) {
    console.log(`[ERROR] ${url} `, JSON.stringify(e));
  }
}

const FETCH_DECODE_ERROR_MESSAGE = "FETCH_DECODE_ERROR_MESSAGE"
const NETWORK_ERROR_MESSAGE = "NETWORK_ERROR_MESSAGE"
export async function fetchWrapper(url, ...args) {
  // Give default values to options if no values were provided


  const response = await fetch(url, ...args);

  //  response.status > 299 or response.status < 200
  if (!response.ok) {
    // Try to parse response data to get error message
    let error = undefined;
    try {
      const r = await response.text();
      error = new Error(`${response.status}: ${r}`);
    } catch (e) {
      error = e;
    }
    Logger.captureException(error);
    // handle different reponse codes (404, 401, 403, etc)
    throw error;
  }

  const data = await response.json().catch((e) => {
    Logger.captureException(url, e);
    throw new Error(FETCH_DECODE_ERROR_MESSAGE);
  });
  console.log(`[${response.status}] ${response.url} --- `, JSON.stringify
    (data).slice(0,50))
  return new Response(JSON.stringify
    (data));
}
