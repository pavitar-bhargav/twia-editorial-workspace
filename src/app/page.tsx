import { Workspace } from "@/components/workspace";
import { readDeskDocs } from "@/lib/desk-docs";

export default async function Page() {
  const docs = await readDeskDocs();
  return <Workspace productNote={docs.productNote} sampleEditorial={docs.sampleEditorial} />;
}
