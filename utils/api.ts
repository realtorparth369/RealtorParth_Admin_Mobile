const API_URL =
  "https://realtorparth.ca/api";

type ApiOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

export async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    token,
  } = options;

  const headers: Record<
    string,
    string
  > = {
    "Content-Type":
      "application/json",
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method,
      headers,
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    }
  );

  const contentType =
    response.headers.get(
      "content-type"
    );

  const data =
    contentType?.includes(
      "application/json"
    )
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    throw new Error(
      typeof data === "string"
        ? data
        : data?.message ||
            `API error: ${response.status}`
    );
  }

  return data as T;
}