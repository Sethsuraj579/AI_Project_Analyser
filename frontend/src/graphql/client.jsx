import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, Observable, from as apolloFrom } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { gql } from '@apollo/client';

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:8000/graphql/',
  fetchOptions: {
    mode: 'cors',
  },
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if available
const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    operation.setContext({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  return forward(operation);
});

const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($token: String!) {
    refreshToken(token: $token) {
      token
      payload
    }
  }
`;

let isRefreshing = false;
let pendingRequests = [];

const resolvePendingRequests = () => {
  pendingRequests.forEach((cb) => cb());
  pendingRequests = [];
};

const isDev = import.meta.env.DEV;

// Error link: catch expired tokens, attempt refresh, or force logout
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  // Keep diagnostics during local development; avoid noisy logs in production.
  if (networkError && isDev) {
    console.error('🛑 Network Error:', networkError);
    console.error('   Operation:', operation.operationName);
    if (networkError.statusCode === 400) {
      console.error('   ⚠️ HTTP 400 Bad Request - check request format');
    }
  }

  if (!graphQLErrors) return;

  const expiredError = graphQLErrors.find(
    (err) =>
      err.message === 'Signature has expired' ||
      err.message?.toLowerCase().includes('signature has expired')
  );

  if (!expiredError) return;

  const oldToken = localStorage.getItem('jwt_token');
  if (!oldToken) {
    forceLogout();
    return;
  }

  if (!isRefreshing) {
    isRefreshing = true;

    // Use a plain fetch to avoid infinite loop through the error link
    const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:8000/graphql/';
    fetch(graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation RefreshToken($token: String!) { refreshToken(token: $token) { token payload } }`,
        variables: { token: oldToken },
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        const newToken = result?.data?.refreshToken?.token;
        if (newToken) {
          localStorage.setItem('jwt_token', newToken);
          resolvePendingRequests();
        } else {
          forceLogout();
        }
      })
      .catch(() => {
        forceLogout();
      })
      .finally(() => {
        isRefreshing = false;
      });
  }

  // Queue the failed request to retry after refresh
  return new Observable((observer) => {
    pendingRequests.push(() => {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        operation.setContext({
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      forward(operation).subscribe(observer);
    });
  });
});

function forceLogout() {
  localStorage.removeItem('jwt_token');
  pendingRequests = [];
  // Dispatch a custom event so App.jsx can react
  window.dispatchEvent(new Event('auth:logout'));
}

export const client = new ApolloClient({
  link: apolloFrom([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
    query: { fetchPolicy: 'network-only' },
  },
});
