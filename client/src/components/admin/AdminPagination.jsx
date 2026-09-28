import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const AdminPagination = ({ page, pageSize, total, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-line/10 text-sm">
      <span className="text-subtle">
        Page {page} of {totalPages} · {total} total
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-line/5 hover:bg-line/10 border border-line/10 transition-colors text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FiChevronLeft size={12} /> Prev
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-line/5 hover:bg-line/10 border border-line/10 transition-colors text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next <FiChevronRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;
