import { fail, json } from "@/lib/http";
import { listRequests } from "@/lib/db";
import { intakeForOtto, isOttoAuthorized } from "@/lib/otto";

/**
 * Otto's queue. Default: submitted requests Otto has not yet acknowledged.
 * ?status=<RequestStatus> filters by any status.
 */
export async function GET(req: Request) {
  if (!isOttoAuthorized(req)) return fail(401, "Unauthorized");
  const status = new URL(req.url).searchParams.get("status");
  const all = await listRequests();
  const items = all.filter((r) =>
    status ? r.status === status : r.status === "submitted" || r.status === "handoff_failed",
  );
  return json({ requests: items.map(intakeForOtto) });
}
