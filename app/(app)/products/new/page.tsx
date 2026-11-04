import { getDictionary } from "@/lib/i18n";
import { Page, PageHeader } from "@/components/ui/page";
import { ProductEditor } from "../product-editor";

export default async function NewProductPage() {
  const { dict } = await getDictionary();

  return (
    <Page wide>
      <PageHeader
        title={dict.products.addProduct}
        subtitle={dict.products.addProductHint}
        backHref="/products"
        backLabel={dict.common.back}
      />
      <ProductEditor dict={dict} />
    </Page>
  );
}
