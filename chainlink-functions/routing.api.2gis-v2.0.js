const API_ENDPOINT = "https://routing.api.2gis.com/get_dist_matrix";
const TRANSPORT = "driving";

if (!args || args.length < 2) {
  throw new Error(`Invalid args: ${JSON.stringify(args)}`);
}

const points = JSON.parse(args[0]);
const sources = JSON.parse(args[1]);
const targets = points.map((_, i) => i).filter((i) => !sources.includes(i));

const apiKey = secrets.apiKey;
if (!apiKey) {
  throw new Error("2GIS API key not set");
}

const normalizedPoints = points.map((p) => ({
  lat: p.lat / 1e6,
  lon: p.lon / 1e6,
}));

const normalizedSources = sources;

const requestParams = {
  url: `${API_ENDPOINT}?key=${apiKey}&version=2.0`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  data: {
    points: normalizedPoints,
    sources: normalizedSources,
    targets: targets,
    transport: TRANSPORT,
  },
};

let response;
try {
  response = await Functions.makeHttpRequest(requestParams);
} catch (error) {
  throw new Error(`2GIS API request failed: ${error.message}`);
}

if (!response || !response.data || !response.data.routes) {
  throw new Error("Invalid response from 2GIS");
}

const routes = response.data.routes;

if (!Array.isArray(routes) || routes.length === 0) {
  throw new Error("No valid routes returned");
}

const route = routes.find((route) => route.status === "OK");

if (!route) {
  throw Error("No valid route found");
}

return Functions.encodeUint256(Number(route.distance));
