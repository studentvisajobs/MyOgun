export const runtime = "nodejs";

export async function POST() {
  return Response.json(
    { error: "This endpoint is disabled." },
    { status: 410 }
  );
}
