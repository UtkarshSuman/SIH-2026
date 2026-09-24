/**
 * FEATURE: Admin-only page for managing RAG documents. Already covered
 * by /dashboard/* login protection in middleware.ts - this adds the
 * stricter role check on top, redirecting non-admins.
 * INSTALLATION: none.
 */
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth/config";
import { RagDocumentUploadForm } from "@/components/admin/rag-document-upload-form";

export default async function RagDocumentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">RAG Document Management</h1>
      <RagDocumentUploadForm />
    </div>
  );
}