import { requestWithMetadata } from "../../api/apiClient";

export async function deleteInterviewSession(
  sessionId: string,
  signal?: AbortSignal,
): Promise<void> {
  await requestWithMetadata<void>(
    `/interview-sessions/${encodeURIComponent(sessionId)}`,
    {
      method: "DELETE",
      authentication: "required",
      signal,
    },
  );
}
