export const runtime = "nodejs";

export async function GET() {
  return Response.json(
    { error: "Database seeding endpoint is disabled." },
    { status: 410 }
  );
}
