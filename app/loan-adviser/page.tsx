import LoanAdviser from "@/components/LoanAdviser";

export const metadata = {
  title: "Loan Adviser | Lending Platform",
  description: "Project new loans based on current receivables",
};

export default function LoanAdviserPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <LoanAdviser />
    </div>
  );
}
