import { notFound } from "next/navigation";
import { getProductLines } from "@/lib/db/queries";
import { getDictionary } from "@/lib/i18n";
import { Page, PageHeader } from "@/components/ui/page";
import { ProductEditor } from "../../product-editor";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { dict } = await getDictionary();
  const { id } = await params;
  const lines = await getProductLines();
  const line = lines.find((l) => l.id === Number(id));
  if (!line) notFound();

  return (
    <Page wide>
      <PageHeader
        title={dict.products.editProduct}
        subtitle={line.name}
        backHref={`/products/${line.id}`}
        backLabel={dict.common.back}
      />
      <ProductEditor line={line} dict={dict} />
    </Page>
  );
}
