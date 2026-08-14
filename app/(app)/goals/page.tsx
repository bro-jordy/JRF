import { createClient } from "@/lib/supabase/server";
import { AddGoalForm } from "@/components/goals/AddGoalForm";
import { GoalRow } from "@/components/goals/GoalRow";
import { BackLink } from "@/components/ui/BackLink";

type GoalProgress = {
  saving_goal_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: string;
};

export default async function GoalsPage() {
  const supabase = await createClient();

  const { data: goals } = await supabase
    .from("saving_goal_progress")
    .select("*")
    .eq("status", "active")
    .order("saving_goal_id");

  return (
    <main className="flex flex-col gap-6 px-4 pt-6">
      <BackLink />
      <h1 className="text-xl font-semibold">Saving Goals</h1>

      <AddGoalForm />

      <div className="flex flex-col gap-3">
        {((goals as GoalProgress[] | null) ?? []).map((goal) => (
          <GoalRow key={goal.saving_goal_id} goal={goal} />
        ))}

        {(goals?.length ?? 0) === 0 && (
          <p className="text-sm text-neutral-500">Belum ada saving goal.</p>
        )}
      </div>
    </main>
  );
}
