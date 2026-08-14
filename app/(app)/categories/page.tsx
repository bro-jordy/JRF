import { createClient } from "@/lib/supabase/server";
import { AddCategoryForm } from "@/components/categories/AddCategoryForm";
import { CategoryRow } from "@/components/categories/CategoryRow";
import { BackLink } from "@/components/ui/BackLink";

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  is_archived: boolean;
};

export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type, is_archived")
    .order("type")
    .order("name");

  const active = (categories as Category[] | null)?.filter((c) => !c.is_archived) ?? [];
  const archived = (categories as Category[] | null)?.filter((c) => c.is_archived) ?? [];

  return (
    <main className="flex flex-col gap-6 px-4 pt-6 pb-24">
      <BackLink />
      <h1 className="text-xl font-semibold">Categories</h1>

      <AddCategoryForm />

      {/* Income */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-500">Income</h2>
        {active.filter((c) => c.type === "income").map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
        {active.filter((c) => c.type === "income").length === 0 && (
          <p className="text-sm text-neutral-400">Belum ada kategori income.</p>
        )}
      </section>

      {/* Expense */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-500">Expense</h2>
        {active.filter((c) => c.type === "expense").map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
        {active.filter((c) => c.type === "expense").length === 0 && (
          <p className="text-sm text-neutral-400">Belum ada kategori expense.</p>
        )}
      </section>

      {/* Archived */}
      {archived.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-400">Archived</h2>
          {archived.map((c) => (
            <div key={c.id} className="opacity-50">
              <CategoryRow category={c} />
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
