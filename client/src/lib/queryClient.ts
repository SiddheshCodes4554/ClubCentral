import { QueryClient, QueryFunction } from "@tanstack/react-query";

const getAuthToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem("auth_token");

const buildHeaders = (hasBody: boolean): HeadersInit => {
  const headers: Record<string, string> = {};

  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText || `HTTP ${res.status}`;

    try {
      const cloned = res.clone();
      const contentType = cloned.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const body = await cloned.json();
        if (body && typeof body === "object") {
          if (typeof (body as { message?: unknown }).message === "string") {
            errorMessage = (body as { message: string }).message;
          } else {
            errorMessage = JSON.stringify(body);
          }
        }
      } else {
        const text = await cloned.text();
        if (text) {
          errorMessage = text;
        }
      }
    } catch (_error) {
      // ignore parsing errors and fall back to the default message
    }

    throw new Error(errorMessage || `HTTP ${res.status}`);
  }
}

export async function apiRequest<T = unknown>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: buildHeaders(data !== undefined),
    body: data !== undefined ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);

  const contentLength = res.headers.get("content-length");
  if (res.status === 204 || contentLength === "0") {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  const text = await res.text();
  return text as unknown as T;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export function getQueryFn<T>({ on401: unauthorizedBehavior }: { on401: UnauthorizedBehavior }): QueryFunction<T> {
  return async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: buildHeaders(false),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);

    if (res.status === 204) {
      return undefined as T;
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await res.json()) as T;
    }

    const text = await res.text();
    return text as unknown as T;
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
