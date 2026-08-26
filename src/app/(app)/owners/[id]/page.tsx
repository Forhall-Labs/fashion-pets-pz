import { OwnerDetail } from "@/modules/owners/OwnerDetail";

export default async function OwnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OwnerDetail ownerId={id} />;
}
