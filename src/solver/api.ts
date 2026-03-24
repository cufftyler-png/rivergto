export async function solveViaApi(payload: any) {
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

  const res = await fetch(`${API_BASE_URL}/solve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return {
      error: `Solve request failed with status ${res.status}`,
    };
  }

  return res.json();
}