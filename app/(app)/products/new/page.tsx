import { getDictionary } from "@/lib/i18n";
import { PageHelp } from "@/components/page-help";
import { Page, PageHeader } from "@/components/ui/page";
import { ProductEditor } from "../product-editor";

export default async function NewProductPage() {
  const { dict } = await getDictionary();

  return (
    <Page wide>
      <PageHeader
        title={dict.products.addProduct}
        help={<PageHelp topic="addProduct" dict={dict} />}
        subtitle={dict.products.addProductHint}
        backHref="/products"
        backLabel={dict.common.back}
      />
      <ProductEditor dict={dict} />
    </Page>
  );
}
