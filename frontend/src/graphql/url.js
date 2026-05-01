function buildDefaultGraphqlUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:8000/graphql/';
  }

  const { hostname, protocol } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/graphql/';
  }

  if (hostname === 'api.analyser8.tech') {
    return `${protocol}//api.analyser8.tech/graphql/`;
  }

  if (hostname === 'www.analyser8.tech' || hostname === 'analyser8.tech') {
    return `${protocol}//api.analyser8.tech/graphql/`;
  }

  return `${protocol}//${hostname}/graphql/`;
}

export function getGraphqlUrl() {
  const configured = (import.meta.env.VITE_GRAPHQL_URL || '').trim();

  if (configured) {
    return configured;
  }

  return buildDefaultGraphqlUrl();
}
